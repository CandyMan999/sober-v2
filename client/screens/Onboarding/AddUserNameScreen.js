import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
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
  Animated,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Context from "../../context";
import LogoIcon from "../../assets/icon.png";
import { Ionicons } from "@expo/vector-icons";

import { useClient } from "../../client";
import { UPDATE_USER_PROFILE_MUTATION } from "../../GraphQL/mutations";
import { FETCH_ME_QUERY } from "../../GraphQL/queries";
import { COLORS } from "../../constants/colors";

const MIN_LEN = 3;
const PUSH_TOKEN_KEY = "expoPushToken";
const APPLE_ID_KEY = "appleUserId";

const {
  primaryBackground,
  cardBackground,
  accent,

  textPrimary,
  textSecondary,
} = COLORS;

const UsernameScreen = ({ navigation, route }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);

  const { accent: accentColor, accentSoft } = COLORS;

  const usernameFromParams = route?.params?.username || "";
  const hasUsernameFromParams =
    !!usernameFromParams && usernameFromParams.trim().length >= MIN_LEN;

  // 1 = notifications, 2 = username (for new users only)
  const [step, setStep] = useState(1);

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifStatus, setNotifStatus] = useState(null);
  const [pushToken, setPushToken] = useState(route?.params?.pushToken || null);
  const [appleId, setAppleId] = useState(route?.params?.appleId || null);
  const [showNotifPointer, setShowNotifPointer] = useState(false);
  const notifArrowAnim = useRef(new Animated.Value(0)).current;
  const notifArrowBaseYOffset = useRef(
    new Animated.Value(Platform.select({ ios: 85, android: 76, default: 84 }))
  ).current;
  const notifArrowBaseXOffset = Platform.select({
    ios: 75,
    android: 78,
    default: 86,
  });

  const [username, setUsername] = useState(usernameFromParams);
  const [saving, setSaving] = useState(false);
  const isValid = username.trim().length >= MIN_LEN;

  const [initializing, setInitializing] = useState(true);

  // 🚦 guard so we only navigate once
  const hasRoutedRef = useRef(false);

  useEffect(() => {
    const ensureAppleIdentity = async () => {
      const storedAppleId =
        route?.params?.appleId || (await AsyncStorage.getItem(APPLE_ID_KEY));

      if (storedAppleId) {
        setAppleId(storedAppleId);
        await AsyncStorage.setItem(APPLE_ID_KEY, storedAppleId);
        return;
      }

      navigation.replace("AppleLogin");
    };

    ensureAppleIdentity();
  }, [navigation, route?.params?.appleId]);

  const updateLocationIfGranted = useCallback(
    async (token) => {
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
        appleId,
        lat: coords.latitude,
        long: coords.longitude,
      });
    } catch (err) {
      console.log("Unable to refresh location:", err);
    }
    },
    [appleId, client]
  );

  const safeNavigateReset = useCallback(
    (config) => {
      if (hasRoutedRef.current) return;
      hasRoutedRef.current = true;
      navigation.reset(config);
    },
    [navigation]
  );

  // ------- helper: fetch "me" with a known token and route forward -------
  const fetchMeWithToken = useCallback(
    async (token, appleIdOverride = appleId) => {
      const activeAppleId = appleIdOverride || appleId;
      if (!activeAppleId) return;

      const tokenToUse = token || pushToken || null;

    try {
      const data = await client.request(FETCH_ME_QUERY, {
        token: tokenToUse,
        appleId: activeAppleId,
      });
      const me = data?.fetchMe;

      if (me) {
        dispatch({ type: "SET_USER", payload: me });
      }

      if (me?.username && me.username.trim().length >= MIN_LEN) {
        const { status, scope } =
          await Location.getForegroundPermissionsAsync();
        const hasAlwaysPermission = status === "granted" && scope === "always";

        const hasProfilePic = !!(me.profilePic || me.profilePicUrl);

        if (hasAlwaysPermission && me.sobrietyStartAt && hasProfilePic) {
          await updateLocationIfGranted(tokenToUse);

          safeNavigateReset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          });
          return;
        }

        await updateLocationIfGranted(tokenToUse);

        const nextRouteName = !hasProfilePic
          ? "AddPhoto"
          : !me.sobrietyStartAt
          ? "AddSobrietyDate"
          : "LocationPermission";

        safeNavigateReset({
          index: 0,
          routes: [
            {
              name: nextRouteName,
              params: {
                username: me.username || username,
                photoURI: me.profilePicUrl || me.profilePic?.url || null,
                pushToken: tokenToUse,
                appleId: activeAppleId,
              },
            },
          ],
        });
        return;
      }

      if (!hasUsernameFromParams && me?.username) {
        setUsername(me.username);
      }

      await updateLocationIfGranted(tokenToUse);
      setStep(hasUsernameFromParams ? 1 : 2);
      } catch (err) {
        console.log("Error fetching me with token:", err);
        setStep(hasUsernameFromParams ? 1 : 2);
      }
    },
    [
      appleId,
      dispatch,
      hasUsernameFromParams,
      navigation,
      pushToken,
      safeNavigateReset,
      updateLocationIfGranted,
      username,
    ]
  );

  // ------- init flow -------
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const storedAppleId =
          route?.params?.appleId || (await AsyncStorage.getItem(APPLE_ID_KEY));

        if (!storedAppleId) {
          navigation.replace("AppleLogin");
          return;
        }

        if (cancelled) return;

        setAppleId(storedAppleId);
        await AsyncStorage.setItem(APPLE_ID_KEY, storedAppleId);

        let tokenToUse =
          route?.params?.pushToken || (await AsyncStorage.getItem(PUSH_TOKEN_KEY));

        if (!tokenToUse) {
          const { status } = await Notifications.getPermissionsAsync();
          if (status === "granted" && Device.isDevice) {
            try {
              const res = await Notifications.getExpoPushTokenAsync();
              tokenToUse = res.data;
              await AsyncStorage.setItem(PUSH_TOKEN_KEY, tokenToUse);
            } catch (e) {
              console.log("Error getting push token on init:", e);
            }
          }
        }

        if (!cancelled && tokenToUse) {
          setPushToken(tokenToUse);
        }

        await fetchMeWithToken(tokenToUse, storedAppleId);

        if (!hasUsernameFromParams && !username) {
          setStep(2);
        }
      } catch (err) {
        console.log("Error initializing UsernameScreen:", err);
        setStep(hasUsernameFromParams ? 1 : 2);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [
    fetchMeWithToken,
    hasUsernameFromParams,
    navigation,
    route?.params?.appleId,
    route?.params?.pushToken,
    username,
  ]);

  useEffect(() => {
    if (!showNotifPointer) return;

    notifArrowAnim.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(notifArrowAnim, {
          toValue: -12,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(notifArrowAnim, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [notifArrowAnim, showNotifPointer]);

  // ------- notifications step: user taps "Enable" -------
  const handleEnableNotifications = () => {
    if (notifLoading) return;
    beginNotificationRequest();
  };

  const handleOpenNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (err) {
      console.log("Unable to open settings:", err);
      return;
    }

    // Re-check after returning from settings
    setTimeout(async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setNotifStatus(status);

        if (status !== "granted") return;

        if (!Device.isDevice) {
          if (!hasUsernameFromParams) {
            setStep(2);
          }
          return;
        }

        let tokenToUse =
          pushToken || (await AsyncStorage.getItem(PUSH_TOKEN_KEY));

        if (!tokenToUse) {
          const tokenResult = await Notifications.getExpoPushTokenAsync();
          tokenToUse = tokenResult.data;
          setPushToken(tokenToUse);
          await AsyncStorage.setItem(PUSH_TOKEN_KEY, tokenToUse);
        }

        await fetchMeWithToken(tokenToUse);

        if (!hasUsernameFromParams) {
          setStep(2);
        }
      } catch (err) {
        console.log("Error refreshing notif permissions after settings:", err);
      }
    }, 1200);
  };

  const beginNotificationRequest = async () => {
    if (notifLoading) return;

    try {
      setShowNotifPointer(true);
      setNotifLoading(true);

      // Let the pointer render underneath the native prompt
      await new Promise((resolve) => setTimeout(resolve, 120));

      if (!Device.isDevice) {
        Alert.alert(
          "Notifications not available",
          "Push notifications only work on a physical device."
        );
        setNotifStatus("denied");
        if (!hasUsernameFromParams) {
          setStep(2);
        } else {
          // returning user: just move them along
          await routeForwardAfterNotifDecision();
        }
        setShowNotifPointer(false);
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
          "You can turn them on later in Settings. We'll still support you.",
          [
            { text: "Open Settings", onPress: handleOpenNotificationSettings },
            {
              text: "Continue",
              style: "cancel",
              onPress: async () => {
                if (hasUsernameFromParams) {
                  await routeForwardAfterNotifDecision();
                } else {
                  setStep(2);
                }
              },
            },
          ]
        );
        setShowNotifPointer(false);
        return;
      }

      const tokenResult = await Notifications.getExpoPushTokenAsync();
      const token = tokenResult.data;
      console.log("📲 Expo push token:", token);

      setPushToken(token);
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

      setNotifStatus("granted");
      await fetchMeWithToken(token);

      if (!hasUsernameFromParams) {
        setStep(2);
      }
    } catch (error) {
      console.log("Error enabling notifications:", error);
      Alert.alert(
        "Error",
        "Something went wrong while enabling notifications. You can try again later."
      );
      if (!hasUsernameFromParams) {
        setStep(2);
      } else {
        await routeForwardAfterNotifDecision();
      }
    } finally {
      setNotifLoading(false);
      setShowNotifPointer(false);
    }
  };

  // For users who already have username: after any notif decision, just move them on
  const routeForwardAfterNotifDecision = async () => {
    try {
      const tokenToUse =
        pushToken ||
        route?.params?.pushToken ||
        (await AsyncStorage.getItem(PUSH_TOKEN_KEY));

      await fetchMeWithToken(tokenToUse);
    } catch (e) {
      console.log("routeForwardAfterNotifDecision error:", e);
      // Worst case, just go to main app
      safeNavigateReset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    }
  };

  const handleSkipNotifications = async () => {
    setNotifStatus("denied");
    setShowNotifPointer(false);

    if (
      state.profileOverview.username &&
      !state.profileOverview.profilePicUrl
    ) {
      navigation.navigate("AddPhoto");
    }

    if (!state.profileOverview.sobrietyStartAt) {
      navigation.navigate("AddSobrietyDate");
    }
    if (!state.profileOverview.notificationSettings.locationTrackingEnabled) {
      navigation.navigate("LocationPermission");
    } else if (
      state.profileOverview.username &&
      !!state.profileOverview.locationTrackingEnabled
    ) {
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
    }

    // New users without username still see username step
    setStep(2);
  };

  const handleContinue = async () => {
    if (!isValid || saving) return;

    if (!appleId) {
      Alert.alert(
        "Sign in required",
        "Please sign in with Apple to continue your onboarding."
      );
      navigation.replace("AppleLogin");
      return;
    }

    try {
      setSaving(true);

      const variables = {
        token: pushToken,
        appleId,
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

      navigation.navigate("AddPhoto", { username, pushToken, appleId });
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
      <Text style={styles.sectionLabel}>
        {hasUsernameFromParams ? "Notifications" : "Step 1 of 2"}
      </Text>

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
          colors={
            notifLoading ? ["#4B5563", "#4B5563"] : [accentColor, accentSoft]
          }
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
        <View style={styles.settingsHelper}>
          <Text style={styles.smallNote}>
            You can always turn notifications on later in Settings.
          </Text>
          <TouchableOpacity
            onPress={handleOpenNotificationSettings}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
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
            !isValid || saving
              ? ["#4B5563", "#4B5563"]
              : [accentColor, accentSoft]
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
          <ActivityIndicator size="large" color={accentColor} />
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
                Sober <Text style={styles.appAccent}>Motivation</Text>
              </Text>
              <Text style={styles.tagline}>
                Build a life you don’t want to numb.
              </Text>
            </View>
          </View>
        </View>

        {/* Card content */}
        {step === 1 || hasUsernameFromParams
          ? renderNotificationStep()
          : renderUsernameStep()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            No public email. No phone number. Just a name and your story.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {showNotifPointer && (
        <View pointerEvents="none" style={styles.permissionOverlay}>
          <Animated.View
            style={[
              styles.arrowBubble,
              {
                transform: [
                  {
                    translateY: Animated.add(
                      notifArrowAnim,
                      notifArrowBaseYOffset
                    ),
                  },
                  { translateX: notifArrowBaseXOffset },
                ],
              },
            ]}
          >
            <Ionicons name="arrow-up" size={42} color="#fff" />
          </Animated.View>
        </View>
      )}
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
    alignItems: "flex-start",
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
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.8,
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
  settingsHelper: {
    alignItems: "center",
    marginTop: 6,
  },
  settingsButton: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  settingsButtonText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "600",
  },
  permissionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowBubble: {
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});

export default UsernameScreen;
