// screens/Onboarding/AddSobrietyDateScreen.js
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useClient } from "../../client";
import { RESET_SOBRIETY_MUTATION } from "../../GraphQL/mutations";
import Context from "../../context";

import LogoIcon from "../../assets/icon.png";
import { COLORS } from "../../constants/colors";

const AddSobrietyDateScreen = ({ navigation, route }) => {
  const client = useClient();
  const { dispatch } = useContext(Context);
  const username = route?.params?.username || "you";
  const token = route?.params?.pushToken || null;

  const { primaryBackground, cardBackground, accent, accentSoft, textPrimary, textSecondary } =
    COLORS;
  // Default to today's date, but user will pick their sobriety start date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [useToday, setUseToday] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const validateDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected > today) {
      setError(
        "You cannot select a future date. Please choose today or a past date."
      );
      return false;
    }
    setError(null);
    return true;
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (event.type === "set" && date) {
      if (validateDate(date)) {
        setSelectedDate(date);
        setUseToday(false); // User picked a date, so not using "today" option
      } else {
        // On Android, show alert if invalid date
        if (Platform.OS === "android") {
          Alert.alert(
            "Invalid Date",
            "You cannot select a future date. Please choose today or a past date."
          );
        }
      }
    } else if (event.type === "dismissed") {
      // User cancelled on Android
      setShowPicker(false);
    }
  };

  const handleContinue = async () => {
    if (!validateDate(selectedDate)) {
      return;
    }

    if (saving) return;

    try {
      setSaving(true);

      // Format date as ISO string
      const sobrietyStartAtISO = selectedDate.toISOString();

      console.log(
        "➡️ Calling UPDATE_USER_PROFILE_MUTATION with sobrietyStartAt..."
      );
      const { resetSobrietyDate } = await client.request(
        RESET_SOBRIETY_MUTATION,
        {
          token,
          newStartAt: sobrietyStartAtISO,
        }
      );
      console.log(
        "✅ User profile updated with sobriety date: ",
        resetSobrietyDate
      );

      await dispatch({ type: "SET_USER", payload: resetSobrietyDate });

      // Navigate to Location Permission screen
      navigation.navigate("LocationPermission");
    } catch (err) {
      console.log("Error saving sobriety date:", err);
      Alert.alert(
        "Save failed",
        "We couldn't save your sobriety date right now. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (saving) return;

    try {
      navigation.navigate("LocationPermission");
    } catch (err) {
      console.log("Error saving profile:", err);

      navigation.reset({
        index: 0,
        routes: [{ name: "LocationPermission" }],
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const daysSober = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const handleSetToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setUseToday(true);
    setShowPicker(false);
    setError(null);
  };

  const handlePickDate = () => {
    setUseToday(false);
    setShowPicker(true);
    if (Platform.OS === "android") {
      // On Android, the picker will show as a modal
    }
  };

  const isToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return today.getTime() === selected.getTime();
  };

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
              <Text style={styles.tagline}>
                Every day counts. When did your journey begin?
              </Text>
            </View>
          </View>
        </View>

        {/* Card Container - centers the card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Step 3 of 4</Text>

            <Text style={styles.title}>
              When did you <Text style={styles.titleAccent}>start</Text>?
            </Text>

            <Text style={styles.helper}>
              This helps us celebrate your milestones and track your progress.
            </Text>

            {/* Option Buttons */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  useToday && styles.optionButtonActive,
                ]}
                onPress={handleSetToday}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    useToday && styles.optionButtonTextActive,
                  ]}
                >
                  Starts today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  !useToday && styles.optionButtonActive,
                ]}
                onPress={handlePickDate}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    !useToday && styles.optionButtonTextActive,
                  ]}
                >
                  Pick a date
                </Text>
              </TouchableOpacity>
            </View>

            {/* Days Counter - always show */}
            {daysSober() >= 0 && (
              <View style={styles.daysCounterWrapper}>
                <Text style={styles.daysCounter}>
                  {daysSober()} {daysSober() === 1 ? "day" : "days"} sober
                </Text>
              </View>
            )}

            {/* Error message */}
            {error && (
              <View style={styles.errorWrapper}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Date Picker - only show when "Pick a date" is selected */}
            {showPicker && !useToday && Platform.OS === "ios" && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  textColor="white"
                  style={styles.picker}
                />
              </View>
            )}

            {/* Android picker shows as modal, handled in handleDateChange */}
            {Platform.OS === "android" && showPicker && !useToday && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            {/* Primary CTA */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!!error || saving) && { opacity: 0.6 },
              ]}
              activeOpacity={0.9}
              onPress={handleContinue}
              disabled={!!error || saving}
            >
              <LinearGradient
                colors={
                  !error && !saving
                    ? [accent, accentSoft]
                    : ["#4B5563", "#4B5563"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                {saving ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.primaryText}>Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Skip link */}
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipWrapper}
              activeOpacity={saving ? 1 : 0.7}
              disabled={saving}
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
    backgroundColor: primaryBackground,
  },
  flex: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: textPrimary,
  },
  appAccent: {
    color: accent,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: textSecondary,
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
    color: textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: textPrimary,
    marginBottom: 8,
  },
  titleAccent: {
    color: accent,
  },
  helper: {
    fontSize: 14,
    color: textSecondary,
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(55,65,81,0.9)",
    backgroundColor: "rgba(15,23,42,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionButtonActive: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: accent,
  },
  optionButtonText: {
    color: textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  optionButtonTextActive: {
    color: accent,
  },
  daysCounterWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  daysCounter: {
    fontSize: 32,
    color: accent,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  errorWrapper: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorText: {
    color: "#F97373",
    fontSize: 13,
    textAlign: "center",
  },
  pickerContainer: {
    marginTop: 8,
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 200 : undefined,
  },
  primaryButton: {
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 12,
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

export default AddSobrietyDateScreen;
