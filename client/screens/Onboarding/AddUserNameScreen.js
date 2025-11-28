import React, { useState, useEffect, useContext, useRef } from "react";
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
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Context from "../../context";
import LogoIcon from "../../assets/icon.png";

import { useClient } from "../../client";
import { UPDATE_USER_PROFILE_MUTATION } from "../../GraphQL/mutations";
import { FETCH_ME_QUERY } from "../../GraphQL/queries";
import { COLORS } from "../../constants/colors";
const MIN_LEN = 3;
const PUSH_TOKEN_KEY = "expoPushToken";

const UsernameScreen = ({ navigation }) => {
  const client = useClient();
  const { dispatch } = useContext(Context);

  const {
    primaryBackground,
    cardBackground,
    accent,
    accentSoft,
    textPrimary,
    textSecondary,
  } = COLORS;

  // 1 = notifications, 2 = username
  const [step, setStep] = useState(1);

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifStatus, setNotifStatus] = useState(null);
  const [pushToken, setPushToken] = useState(null);

  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const isValid = username.trim().length >= MIN_LEN;

  const [initializing, setInitializing] = useState(true);

  // 🚦 guard so we only navigate once
  const hasRoutedRef = useRef(false);

  const updateLocationIfGranted = async (token) => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });

      const coords = position?.coords;

      if (!coords?.latitude || !coords?.longitude) {
        return;
      }

      await client.request(UPDATE_USER_PROFILE_MUTATION, {
        token,
        lat: coords.latitude,
        long: coords.longitude,
      });
    } catch (err) {
      console.log("Unable to refresh location:", err);
    }
  };

  const safeNavigateReset = (config) => {
    if (hasRoutedRef.current) return;
    hasRoutedRef.current = true;
    navigation.reset(config);
  };

  // ------- helper: fetch "me" with a known token -------
  const fetchMeWithToken = async (token) => {
    if (!token) return;

    try {
      const data = await client.request(FETCH_ME_QUERY, { token });
      const me = data?.fetchMe;

      // if we have a full user with username already
      if (me?.username && me.username.trim().length >= MIN_LEN) {
        dispatch({ type: "SET_USER", payload: me });

        const { status, scope } =
          await Location.getForegroundPermissionsAsync();

        const hasAlwaysPermission = status === "granted" && scope === "always";

        if (hasAlwaysPermission && me.sobrietyStartAt && me.profilePic) {
          await updateLocationIfGranted(token);

          safeNavigateReset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          });
          return;
        }

        await updateLocationIfGranted(token);

        // Otherwise route user to the correct next step
        const nextRouteName = !me.profilePic
          ? "AddPhoto"
          : !me.sobrietyStartAt
          ? "AddSobrietyDate"
          : "LocationPermission"; // ← this is now enforced

        safeNavigateReset({
          index: 0,
          routes: [
            {
              name: nextRouteName,
              params: {
                username: me.username || username,
                photoURI: me.profilePicUrl || null,
                pushToken: token,
              },
            },
          ],
        });
        return; // ⬅ important
      }

      // User exists but no username finalized yet → stay on this screen, step 2
      if (me?.username) {
        setUsername(me.username);
      }
      await updateLocationIfGranted(token);
      setStep(2);
    } catch (err) {
      console.log("Error fetching me with token:", err);

      // On error just decide step based on notification permission
      let { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        setStep(2);
      } else {
        setStep(1);
      }
    }
  };

  // ------- init flow: restore token or get it, THEN fetch me -------
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // 1) Try to restore token from storage
        const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);

        if (cancelled) return;

        if (storedToken) {
          setPushToken(storedToken);
          await fetchMeWithToken(storedToken);
          return;
        }

        // 2) No stored token yet → check notification permissions
        let { status } = await Notifications.getPermissionsAsync();

        if (status === "granted" && Device.isDevice) {
          try {
            const tokenResult = await Notifications.getExpoPushTokenAsync();
            const token = tokenResult.data;
            console.log("📲 Got push token on init:", token);

            if (cancelled) return;

            setPushToken(token);
            await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

            await fetchMeWithToken(token);
            return;
          } catch (err) {
            console.log("Error getting push token on init:", err);
          }
        }

        // If we get here: no token yet, or not granted → show step 1
        setStep(1);
      } catch (err) {
        console.log("Error initializing UsernameScreen:", err);
        setStep(1);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [client, navigation]);

  // ------- notifications step: user taps "Enable" -------
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
        setStep(2);
        return;
      }

      const tokenResult = await Notifications.getExpoPushTokenAsync();
      const token = tokenResult.data;
      console.log("📲 Expo push token:", token);

      setPushToken(token);
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

      setNotifStatus("granted");
      await fetchMeWithToken(token);
    } catch (error) {
      console.log("Error enabling notifications:", error);
      Alert.alert(
        "Error",
        "Something went wrong while enabling notifications. You can try again later."
      );
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

    if (!pushToken) {
      Alert.alert(
        "Missing device ID",
        "We couldn't get your device token yet. Please enable notifications or restart the app."
      );
      return;
    }

    try {
      setSaving(true);

      const variables = {
        token: pushToken,
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

      navigation.navigate("AddPhoto", { username, pushToken });
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
          colors={notifLoading ? ["#4B5563", "#4B5563"] : [accent, accentSoft]}
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
            !isValid || saving ? ["#4B5563", "#4B5563"] : [accent, accentSoft]
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

  // 🔄 While initializing / routing, don't flash steps UI
  if (initializing || hasRoutedRef.current) {
    return (
      <LinearGradient
        colors={["#020617", "#020617", "#111827"]}
        style={styles.root}
      >
        <View style={[styles.flex, { justifyContent: "center" }]}>
          <ActivityIndicator size="large" color={accent} />
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
          <View style={styles.headerRow}>
            <Image source={LogoIcon} style={styles.logo} resizeMode="contain" />

            <View style={styles.headerTextBlock}>
              <Text style={styles.appName}>
                sober <Text style={styles.appAccent}>motivation</Text>
              </Text>
              <Text style={styles.tagline}>
                Build a life you don’t want to numb.
              </Text>
            </View>
          </View>
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
    backgroundColor: primaryBackground,
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
    alignItems: "flex-start", // ⬅ left-align the whole header block
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },

  headerTextBlock: {
    flexShrink: 1,
  },

  appName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: textPrimary,
    textAlign: "left",
  },

  tagline: {
    marginTop: 4,
    fontSize: 14,
    color: textSecondary,
    textAlign: "left",
  },

  appAccent: {
    color: accent,
  },

  card: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: cardBackground,
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
    color: accent,
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
    color: accent,
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
