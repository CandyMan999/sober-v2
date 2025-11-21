// pages/LocationPermissionScreen.js
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";

const PRIMARY_BG = "#050816";
const CARD_BG = "rgba(15,23,42,0.96)";
const ACCENT = "#F59E0B";
const ACCENT_SOFT = "#FBBF24";

const LocationPermissionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      const backgroundStatus = await Location.getBackgroundPermissionsAsync();

      if (
        foregroundStatus.status === "granted" &&
        backgroundStatus.status === "granted"
      ) {
        // Permissions already granted, navigate to main tabs
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } else {
        setChecking(false);
        // Show info alert on Android
        if (Platform.OS === "android") {
          Alert.alert(
            "Location Permission",
            "Sober Motivation uses your location in the background to provide important notifications and support. This helps us send you alerts when you're near a bar or liquor store, encouraging you to make mindful choices.",
            [{ text: "OK", onPress: () => {} }]
          );
        }
      }
    } catch (error) {
      console.log("Error checking location permission:", error);
      setChecking(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      setLoading(true);

      const foregroundStatus =
        await Location.requestForegroundPermissionsAsync();
      const backgroundStatus =
        await Location.requestBackgroundPermissionsAsync();

      if (
        foregroundStatus.status === "granted" &&
        backgroundStatus.status === "granted"
      ) {
        // Permissions granted, navigate to main tabs
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } else {
        Alert.alert(
          "Location Permission Required",
          "Sober Motivation needs access to your location when the app is closed to make sure you are not at any bars or liquor stores. Please enable 'Always' location access in settings.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                // Still allow them to continue without location
                navigation.reset({
                  index: 0,
                  routes: [{ name: "MainTabs" }],
                });
              },
            },
            { text: "Open Settings", onPress: openAppSettings },
          ]
        );
      }
    } catch (error) {
      console.log("Error requesting location permission:", error);
      Alert.alert(
        "Error",
        "There was an error requesting location permissions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  if (checking) {
    return (
      <LinearGradient
        colors={["#020617", "#020617", "#111827"]}
        style={styles.root}
      >
        <View style={styles.loadingContainer}>
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
      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>
            sober <Text style={styles.appAccent}>motivation</Text>
          </Text>
          <Text style={styles.tagline}>
            Stay aware. Stay strong. Stay sober.
          </Text>
        </View>

        {/* Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Location Services</Text>

            <Text style={styles.title}>
              Enable <Text style={styles.titleAccent}>location</Text> access?
            </Text>

            <Text style={styles.helper}>
              We'll send you gentle reminders if you're near a bar or liquor
              store, helping you make mindful choices in real-time.
            </Text>

            {/* Important Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Important:</Text>
              <Text style={styles.infoText}>
                • Keep the app running in the background
              </Text>
              <Text style={styles.infoText}>
                • Don't force close or kill the app
              </Text>
              <Text style={styles.infoText}>
                • Enable "Always" location access for best results
              </Text>
            </View>

            {/* Primary CTA */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.6 }]}
              activeOpacity={0.9}
              onPress={requestLocationPermission}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ["#4B5563", "#4B5563"] : [ACCENT, ACCENT_SOFT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.primaryText}>Enable Location</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Skip link */}
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipWrapper}
              activeOpacity={loading ? 1 : 0.7}
              disabled={loading}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  cardContainer: {
    flex: 1,
    justifyContent: "center",
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
    color: ACCENT,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#D1D5DB",
    marginBottom: 4,
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 8,
  },
  primaryGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  primaryText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  skipWrapper: {
    marginTop: 10,
    alignItems: "center",
  },
  skipText: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "underline",
  },
});

export default LocationPermissionScreen;

