// screens/Onboarding/LocationPermissionScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import {
  configureLocationTrackingClient,
  initSoberMotionTracking,
} from "../../utils/locationTracking";

import LogoIcon from "../../assets/icon.png";
import { useClient } from "../../client";
import { UPDATE_USER_PROFILE_MUTATION } from "../../GraphQL/mutations";
import { getToken } from "../../utils/helpers";
import { COLORS } from "../../constants/colors";
const {
  primaryBackground,
  cardBackground,
  accent,
  accentSoft,

  textPrimary,
  textSecondary,
} = COLORS;

const LocationPermissionScreen = ({ navigation }) => {
  const client = useClient();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showAlwaysPulse, setShowAlwaysPulse] = useState(false);
  const alwaysPulse = useRef(new Animated.Value(0)).current;
  const alwaysAnchorBottom = Platform.select({
    ios: 196,
    android: 164,
    default: 178,
  });

  const hasAlwaysPermission = async () => {
    const fg = await Location.getForegroundPermissionsAsync();
    const bg = await Location.getBackgroundPermissionsAsync();

    return (
      bg.status === "granted" ||
      (fg.status === "granted" && fg.scope === "always")
    );
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

      if (fg.status !== "granted") {
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
      console.log("Unable to store location:", err);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (!showAlwaysPulse) return;

    alwaysPulse.setValue(0);

    const loop = Animated.loop(
      Animated.timing(alwaysPulse, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => loop.stop();
  }, [alwaysPulse, showAlwaysPulse]);

  const ringScale = alwaysPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const ringOpacity = alwaysPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  const outerRingScale = alwaysPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.7],
  });

  const outerRingOpacity = alwaysPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  const checkPermissions = async () => {
    try {
      if (await hasAlwaysPermission()) {
        configureLocationTrackingClient({
          requestFn: client.request,
          getPushTokenFn: getToken,
        });
        await startMotionTrackingIfPermitted();
        await routeToApp();
        return;
      }

      setChecking(false);
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

  const handlePermissionRequest = async () => {
    setLoading(true);

    try {
      // Request both permissions in correct OS order
      const fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status !== "granted") {
        setLoading(false);
        return Alert.alert(
          "Permission Needed",
          "We need location access to support you in recovery."
        );
      }

      setShowAlwaysPulse(true);
      await new Promise((resolve) => setTimeout(resolve, 120));

      const bg = await Location.requestBackgroundPermissionsAsync();

      if (bg.status === "granted" || (await hasAlwaysPermission())) {
        configureLocationTrackingClient({
          requestFn: client.request,
          getPushTokenFn: getToken,
        });
        await startMotionTrackingIfPermitted();
        await routeToApp();
        return;
      }

      Alert.alert(
        "Always Allow needed",
        "Tap \"Always Allow\" so we can keep you aware even when the app is closed.",
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
      setShowAlwaysPulse(false);
    }
  };

  const openSettings = async () => {
    await Linking.openSettings();
    // Re-check when returning from settings
    setTimeout(checkPermissions, 2000);
  };

  const skip = () => {
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
      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Image source={LogoIcon} style={styles.logo} resizeMode="contain" />
            <View>
              <Text style={styles.appName}>
                sober <Text style={styles.appAccent}>motivation</Text>
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

      {showAlwaysPulse && (
        <View
          pointerEvents="none"
          style={[
            styles.alwaysOverlay,
            { transform: [{ translateY: -alwaysAnchorBottom }] },
          ]}
        >
          <Animated.View
            style={[
              styles.pulseHaloOuter,
              { transform: [{ scale: outerRingScale }], opacity: outerRingOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseHalo,
              { transform: [{ scale: ringScale }], opacity: ringOpacity },
            ]}
          />
          <View style={styles.pulseTarget} />
        </View>
      )}
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
    fontSize: 20,
    fontWeight: "700",
    color: textPrimary,
    textTransform: "uppercase",
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
  alwaysOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseTarget: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: accent,
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    shadowColor: accent,
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  pulseHalo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: accent,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  pulseHaloOuter: {
    position: "absolute",
    width: 184,
    height: 184,
    borderRadius: 92,
    borderWidth: 2,
    borderColor: accent,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
  },
});

export default LocationPermissionScreen;
