// screens/Onboarding/LocationPermissionScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";

import LogoIcon from "../../assets/icon.png";
import { useClient } from "../../client";
import { UPDATE_USER_PROFILE_MUTATION } from "../../GraphQL/mutations";
import { getToken } from "../../utils/helpers";
import { COLORS } from "../../constants/colors";
const {
  primaryBackground,
  cardBackground,
  accent,

  textPrimary,
  textSecondary,
} = COLORS;

const LocationPermissionScreen = ({ navigation }) => {
  const client = useClient();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const { accent, accentSoft } = COLORS;

  const updateLocationIfPermitted = async () => {
    try {
      const token = await getToken();

      if (!token) return;

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
      console.log("Unable to store location:", err);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const fg = await Location.getForegroundPermissionsAsync();
      const bg = await Location.getBackgroundPermissionsAsync();

      const hasAlways =
        fg.status === "granted" &&
        fg.scope === "always" &&
        bg.status === "granted";

      if (hasAlways) {
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

      const bg = await Location.requestBackgroundPermissionsAsync();

      const hasAlways =
        fg.status === "granted" &&
        fg.scope === "always" &&
        bg.status === "granted";

      if (hasAlways) {
        await routeToApp();
        return;
      }

      // iOS requires user to manually change to "Always"
      Alert.alert(
        "Enable ‘Always Allow’",
        "To notify you when you're near a bar or liquor store, set location access to “Always Allow.”",
        [
          { text: "Open Settings", onPress: openSettings },
          {
            text: "Skip",
            style: "cancel",
            onPress: routeToApp,
          },
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
});

export default LocationPermissionScreen;
