// screens/Onboarding/LocationPermissionScreen.js
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import {
  configureLocationTrackingClient,
  initSoberMotionTracking,
} from "../../utils/locationTracking";

import LogoIcon from "../../assets/icon.png";
import { useClient } from "../../client";
import {
  UPDATE_NOTIFICATION_SETTINGS_MUTATION,
  UPDATE_USER_PROFILE_MUTATION,
} from "../../GraphQL/mutations";
import { getToken } from "../../utils/helpers";
import { COLORS } from "../../constants/colors";
import { AlertModal } from "../../components";
import Context from "../../context";

const {
  primaryBackground,
  cardBackground,
  accent,
  accentSoft,
  textPrimary,
  textSecondary,
} = COLORS;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const LocationPermissionScreen = ({ navigation, route }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [reenablePromptVisible, setReenablePromptVisible] = useState(false);

  const shouldRequireReenable = route?.params?.requireReenable === true;

  /**
   * ✅ Single helper used everywhere to answer:
   * "Does the OS currently consider this app to have ALWAYS/BACKGROUND location?"
   */
  const hasAlwaysPermission = async () => {
    try {
      const fg = await Location.getForegroundPermissionsAsync();
      const bg = await Location.getBackgroundPermissionsAsync();

      console.log("[Location] hasAlwaysPermission fg:", fg, "bg:", bg);

      // Background granted is the main signal
      if (bg.status === "granted") return true;

      // Some iOS flows expose "always" via foreground scope
      if (fg.status === "granted" && fg.scope === "always") return true;

      return false;
    } catch (e) {
      console.log("[Location] hasAlwaysPermission failed", e);
      return false;
    }
  };

  const startMotionTrackingIfPermitted = async () => {
    try {
      if (await hasAlwaysPermission()) {
        configureLocationTrackingClient({
          requestFn: client.request,
          getPushTokenFn: getToken,
        });
        console.log("[SoberMotion] Starting motion tracking from onboarding");
        await initSoberMotionTracking();
        return true;
      }
    } catch (error) {
      console.log("[SoberMotion] Unable to start motion tracking", error);
    }

    return false;
  };

  const updateLocationIfPermitted = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const fg = await Location.getForegroundPermissionsAsync();
      if (fg.status !== "granted") return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });

      const coords = position?.coords;
      if (!coords?.latitude || !coords?.longitude) return;

      await client.request(UPDATE_USER_PROFILE_MUTATION, {
        token,
        lat: coords.latitude,
        long: coords.longitude,
      });
    } catch (err) {
      console.log("Unable to store location:", err);
    }
  };

  const persistLocationTrackingPreference = async (enabled) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await client.request(
        UPDATE_NOTIFICATION_SETTINGS_MUTATION,
        {
          token,
          input: { locationTrackingEnabled: enabled },
        }
      );

      const updated =
        response?.updateNotificationSettings?.notificationSettings || null;

      if (updated && state?.user) {
        dispatch({
          type: "SET_USER",
          payload: {
            ...(state?.user || {}),
            notificationSettings: updated,
          },
        });
      }
    } catch (err) {
      console.log("Failed to persist location tracking preference", err);
    }
  };

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPermissions = async () => {
    try {
      const alreadyHasAlways = await hasAlwaysPermission();
      console.log(
        "[Location] checkPermissions -> alreadyHasAlways:",
        alreadyHasAlways
      );

      if (alreadyHasAlways) {
        configureLocationTrackingClient({
          requestFn: client.request,
          getPushTokenFn: getToken,
        });

        if (shouldRequireReenable) {
          setChecking(false);
          setReenablePromptVisible(true);
          return;
        }

        await startMotionTrackingIfPermitted();
        await routeToApp();
        return;
      }

      setChecking(false);
      if (shouldRequireReenable) {
        setReenablePromptVisible(true);
      }
    } catch (err) {
      console.log("Location permission check failed:", err);
      setChecking(false);
    }
  };

  const routeToApp = async () => {
    await updateLocationIfPermitted();

    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  const onAlwaysGrantedFlow = async () => {
    // Centralized success path when we know Always/Background is enabled
    configureLocationTrackingClient({
      requestFn: client.request,
      getPushTokenFn: getToken,
    });

    const started = await startMotionTrackingIfPermitted();
    if (started) {
      await persistLocationTrackingPreference(true);
      setReenablePromptVisible(false);
    }

    await routeToApp();
  };

  const handlePermissionRequest = async () => {
    setLoading(true);

    try {
      console.log("[Location] handlePermissionRequest start");

      // 1. Foreground first
      const fg = await Location.requestForegroundPermissionsAsync();
      console.log("[Location] requestForegroundPermissionsAsync ->", fg);

      if (fg.status !== "granted") {
        setLoading(false);
        return Alert.alert(
          "Permission Needed",
          "We need location access to support you in recovery."
        );
      }

      // 2. Then background (Always)
      const bg = await Location.requestBackgroundPermissionsAsync();
      console.log("[Location] requestBackgroundPermissionsAsync ->", bg);

      // ✅ If the OS explicitly reports background as granted,
      // trust this immediately and DO NOT show the Always warning.
      if (bg.status === "granted") {
        console.log(
          "[Location] Background granted directly from request. Proceeding."
        );
        await onAlwaysGrantedFlow();
        return;
      }

      // 3. Fallback sanity check (covers weird dev/iOS flows)
      await delay(800); // give OS a moment to update state
      const confirmedAlways = await hasAlwaysPermission();
      console.log(
        "[Location] confirmedAlways (post-request) ->",
        confirmedAlways
      );

      if (confirmedAlways) {
        await onAlwaysGrantedFlow();
        return;
      }

      // ❗ At this point we're confident Always isn't enabled
      Alert.alert(
        "Always Allow needed",
        'This is our best feature to help keep you sober — tap "Always Allow" in your settings so we can support you even when the app is closed.',
        [
          { text: "Open Settings", onPress: openSettings },
          { text: "Skip", style: "cancel", onPress: routeToApp },
        ]
      );
    } catch (err) {
      console.log("Location permission error:", err);
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const openSettings = async () => {
    try {
      await Linking.openSettings();
      // Re-check when returning from settings
      setTimeout(checkPermissions, 2000);
    } catch (e) {
      console.log("Failed to open settings", e);
    }
  };

  const skip = () => {
    if (reenablePromptVisible) setReenablePromptVisible(false);
    routeToApp();
  };

  if (checking) {
    return (
      <LinearGradient
        colors={["#020617", "#020617", "#111827"]}
        style={styles.root}
      >
        <View style={styles.center}>
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
      <AlertModal
        visible={reenablePromptVisible}
        type="confirm"
        title="Turn location back on?"
        message="This is the best feature to keep you sober. We use smart geo-fencing to alert you and your buddies when you're near bars or liquor stores — turning this off won't save battery."
        confirmLabel="Turn back on"
        cancelLabel="Skip for now"
        onConfirm={() => {
          setReenablePromptVisible(false);
          handlePermissionRequest();
        }}
        onCancel={skip}
      />

      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Image source={LogoIcon} style={styles.logo} resizeMode="contain" />
            <View>
              <Text style={styles.appName}>
                Sober <Text style={styles.appAccent}>Motivation</Text>
              </Text>
              <Text style={styles.tagline}>Stay aware. Stay strong.</Text>
            </View>
          </View>
        </View>

        {/* Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Location Access</Text>

            <Text style={styles.title}>
              Enable <Text style={styles.titleAccent}>background tracking</Text>
              ?
            </Text>

            <Text style={styles.helper}>
              We’ll send reminders if you’re near bars or liquor stores —
              helping you stay aware when it matters most.
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Why it matters:</Text>
              <Text style={styles.infoText}>• Works even if app is closed</Text>
              <Text style={styles.infoText}>• Smart location alerts</Text>
              <Text style={styles.infoText}>• Better relapse prevention</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.6 }]}
              activeOpacity={0.9}
              disabled={loading}
              onPress={handlePermissionRequest}
            >
              <LinearGradient
                colors={loading ? ["#4B5563", "#4B5563"] : [accent, accentSoft]}
                style={styles.primaryGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.primaryText}>
                    Enable Background Location
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={skip} style={styles.skipWrapper}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: primaryBackground },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  flex: { flex: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },
  header: { marginBottom: 24 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 44, height: 44, borderRadius: 10, marginRight: 12 },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: textPrimary,
  },
  appAccent: { color: accent },
  tagline: { marginTop: 6, fontSize: 14, color: textSecondary },

  cardContainer: { flex: 1, justifyContent: "center" },
  card: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: cardBackground,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
  },
  sectionLabel: {
    fontSize: 12,
    color: textSecondary,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: textPrimary,
    marginBottom: 8,
  },
  titleAccent: { color: accent },
  helper: {
    fontSize: 14,
    color: textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },

  infoBox: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: accent,
    marginBottom: 8,
  },
  infoText: { fontSize: 13, color: textPrimary, marginBottom: 4 },

  primaryButton: { borderRadius: 999, overflow: "hidden", marginTop: 8 },
  primaryGradient: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 999,
  },
  primaryText: { color: "#111827", fontSize: 16, fontWeight: "700" },

  skipWrapper: { marginTop: 10, alignItems: "center" },
  skipText: {
    fontSize: 13,
    color: textSecondary,
    textDecorationLine: "underline",
  },
});

export default LocationPermissionScreen;
