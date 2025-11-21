import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

import { useClient } from "../client";
import { UPDATE_USER_PROFILE_MUTATION } from "../GraphQL/mutations";
import { FETCH_ME_QUERY } from "../GraphQL/queries";

const PRIMARY_BG = "#050816";
const CARD_BG = "rgba(15,23,42,0.96)";
const ACCENT = "#F59E0B"; // golden orange
const ACCENT_SOFT = "#FBBF24";

const MIN_LEN = 3;
const DEV_TOKEN = "dev-token-placeholder";

const UsernameScreen = ({ navigation }) => {
  const client = useClient();

  // step 1 = notifications, step 2 = username
  const [step, setStep] = useState(1);

  // notifications
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifStatus, setNotifStatus] = useState(null); // "granted" | "denied" | null
  const [pushToken, setPushToken] = useState(null);

  // username
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const isValid = username.trim().length >= MIN_LEN;

  // overall init loading (so we don't flash UI while checking)
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // 1) Fetch current user
        const data = await client.request(FETCH_ME_QUERY, {
          token: DEV_TOKEN,
        });

        const me = data?.fetchMe;

        // If user already has a username, skip this whole screen
        if (me?.username && me.username.trim().length >= MIN_LEN) {
          console.log("🙌 User already has username, skipping UsernameScreen");
          navigation.reset({
            index: 0,
            routes: [{ name: "AddPhoto", params: { username: me.username } }],
          });
          return;
        }

        // Optionally pre-fill username if backend has something partial
        if (me?.username) {
          setUsername(me.username);
        }

        // 2) Check notification permissions
        let { status } = await Notifications.getPermissionsAsync();
        if (status === "granted") {
          setStep(2);
          // You *can* grab token here if you want:
          try {
            const tokenResult = await Notifications.getExpoPushTokenAsync();
            setPushToken(tokenResult.data);
          } catch (err) {
            console.log("Error getting push token on init:", err);
          }
        } else {
          setStep(1);
        }
      } catch (err) {
        console.log("Error initializing UsernameScreen:", err);
        // On any error, just start at step 1
        setStep(1);
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, [client, navigation]);

  const handleEnableNotifications = async () => {
    if (notifLoading) return;
    try {
      setNotifLoading(true);

      if (!Device.isDevice) {
        Alert.alert(
          "Notifications not available",
          "Push notifications only work on a physical device."
        );
        setNotifStatus("denied");
        setStep(2);
        return;
      }

      // Check existing permission
      let { status } = await Notifications.getPermissionsAsync();
      console.log("Notifications status:", status);

      if (status !== "granted") {
        const res = await Notifications.requestPermissionsAsync();
        status = res.status;
      }

      if (status !== "granted") {
        setNotifStatus("denied");
        Alert.alert(
          "Notifications disabled",
          "You can turn them on later in Settings. We'll still support you."
        );
        // Still move to username step
        setStep(2);
        return;
      }

      // Get Expo push token
      const tokenResult = await Notifications.getExpoPushTokenAsync();
      const token = tokenResult.data;
      console.log("📲 Expo push token:", token);

      setPushToken(token);
      setNotifStatus("granted");
      setStep(2);
    } catch (error) {
      console.log("Error enabling notifications:", error);
      Alert.alert(
        "Error",
        "Something went wrong while enabling notifications. You can try again later."
      );
      // Let them move on anyway
      setStep(2);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleSkipNotifications = () => {
    setNotifStatus("denied");
    setStep(2);
  };

  const handleContinue = async () => {
    if (!isValid || saving) return;

    try {
      setSaving(true);

      const tokenToSend = pushToken || DEV_TOKEN;

      const variables = {
        token: tokenToSend,
        username,
      };

      console.log("✅ Updating profile with:", variables);

      const { updateUserProfile } = await client.request(
        UPDATE_USER_PROFILE_MUTATION,
        variables
      );

      if (!updateUserProfile?.username) {
        Alert.alert("Error", "Failed to save username. Please try again.");
        return;
      }

      navigation.navigate("AddPhoto");
    } catch (err) {
      console.log("Error saving username:", err);
      Alert.alert(
        "Error",
        "There was a problem saving your username. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const renderNotificationStep = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Step 1 of 2</Text>

      <Text style={styles.title}>
        Turn on <Text style={styles.titleAccent}>notifications</Text>?
      </Text>

      <Text style={styles.helper}>
        We’ll send you encouraging check-ins and reminders when it matters most
        — not spam, just support.
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What you’ll get:</Text>
        <Text style={styles.infoText}>• Gentle daily motivation</Text>
        <Text style={styles.infoText}>• Milestone celebrations</Text>
        <Text style={styles.infoText}>• Nudge when things get tough</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, notifLoading && styles.buttonDisabled]}
        activeOpacity={0.9}
        onPress={handleEnableNotifications}
        disabled={notifLoading}
      >
        <LinearGradient
          colors={notifLoading ? ["#4B5563", "#4B5563"] : [ACCENT, ACCENT_SOFT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          {notifLoading ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.buttonText}>Enable Notifications</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipWrapper}
        onPress={handleSkipNotifications}
        disabled={notifLoading}
      >
        <Text style={styles.skipText}>Not now, I’ll set it up later</Text>
      </TouchableOpacity>

      {notifStatus === "denied" && (
        <Text style={styles.smallNote}>
          You can always turn notifications on later in Settings.
        </Text>
      )}
    </View>
  );

  const renderUsernameStep = () => (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Step 2 of 2</Text>

      <Text style={styles.title}>
        What should we <Text style={styles.titleAccent}>call you</Text>?
      </Text>

      <Text style={styles.helper}>
        This is how you’ll show up in chat and milestones.
      </Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="e.g. NewChapterJohn"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={13}
        />
        <Text
          style={[
            styles.validationText,
            !isValid && username.length > 0 && styles.validationError,
          ]}
        >
          {username.length === 0
            ? "You can change this later."
            : !isValid
            ? "At least 3 characters."
            : "Looks good."}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, (!isValid || saving) && styles.buttonDisabled]}
        activeOpacity={0.9}
        disabled={!isValid || saving}
        onPress={handleContinue}
      >
        <LinearGradient
          colors={
            !isValid || saving ? ["#4B5563", "#4B5563"] : [ACCENT, ACCENT_SOFT]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          {saving ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // While fetching me + checking notifications, show a loading state
  if (initializing) {
    return (
      <LinearGradient
        colors={["#020617", "#020617", "#111827"]}
        style={styles.root}
      >
        <View style={[styles.flex, { justifyContent: "center" }]}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#020617", "#020617", "#111827"]}
      style={styles.root}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>
            sober <Text style={styles.appAccent}>motivation</Text>
          </Text>
          <Text style={styles.tagline}>
            Build a life you don’t want to numb.
          </Text>
        </View>

        {/* Card content */}
        {step === 1 ? renderNotificationStep() : renderUsernameStep()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            No public email. No phone number. Just a name and your story.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PRIMARY_BG,
  },
  flex: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  header: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#E5E7EB",
  },
  appAccent: {
    color: ACCENT,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: "#9CA3AF",
  },
  card: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  titleAccent: {
    color: ACCENT,
  },
  helper: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    color: "#D1D5DB",
    marginBottom: 6,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(55,65,81,0.9)",
    backgroundColor: "rgba(15,23,42,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F9FAFB",
    fontSize: 15,
  },
  validationText: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },
  validationError: {
    color: "#F97373",
  },
  button: {
    marginTop: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  buttonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    marginTop: 24,
    marginBottom: "10%",
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#D1D5DB",
    marginBottom: 4,
    lineHeight: 18,
  },
  skipWrapper: {
    marginTop: 14,
    alignItems: "center",
  },
  skipText: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "underline",
  },
  smallNote: {
    marginTop: 8,
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default UsernameScreen;
