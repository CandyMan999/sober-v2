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

const MILESTONES = [1, 2, 3, 5, 7, 10, 14, 30, 60, 90, 180, 365];

const {
  primaryBackground,
  cardBackground,
  accent,
  accentSoft,
  textPrimary,
  textSecondary,
} = COLORS;

const AddSobrietyDateScreen = ({ navigation, route }) => {
  const client = useClient();
  const { dispatch } = useContext(Context);
  const username = route?.params?.username || "you";
  const token = route?.params?.pushToken || null;

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
        setUseToday(false);
      } else if (Platform.OS === "android") {
        Alert.alert(
          "Invalid Date",
          "You cannot select a future date. Please choose today or a past date."
        );
      }
    } else if (event.type === "dismissed") {
      setShowPicker(false);
    }
  };

  const handleContinue = async () => {
    if (!validateDate(selectedDate) || saving) return;

    try {
      setSaving(true);

      const sobrietyStartAtISO = selectedDate.toISOString();

      const { resetSobrietyDate } = await client.request(
        RESET_SOBRIETY_MUTATION,
        {
          token,
          newStartAt: sobrietyStartAtISO,
        }
      );

      const updatedUser = { ...resetSobrietyDate };
      await dispatch({ type: "SET_USER", payload: updatedUser });

      navigation.navigate("LocationPermission");
    } catch (err) {
      Alert.alert(
        "Save failed",
        "We couldn't save your sobriety date right now. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => navigation.navigate("LocationPermission");

  const daysSober = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today - start) / (1000 * 60 * 60 * 24)));
  };

  return (
    <LinearGradient
      colors={["#020617", "#020617", "#111827"]}
      style={styles.root}
    >
      <View style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Image source={LogoIcon} style={styles.logo} />
            <View>
              <Text style={styles.appName}>
                Sober <Text style={styles.appAccent}>Motivation</Text>
              </Text>
              <Text style={styles.tagline}>
                Every day counts. When did your journey begin?
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Step 3 of 4</Text>

            <Text style={styles.title}>
              When did you <Text style={styles.titleAccent}>start</Text>?
            </Text>

            <Text style={styles.helper}>
              This helps us celebrate your milestones and track your progress.
            </Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  useToday && styles.optionButtonActive,
                ]}
                onPress={() => {
                  setSelectedDate(new Date());
                  setUseToday(true);
                }}
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
                onPress={() => {
                  setUseToday(false);
                  setShowPicker(true);
                }}
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

            <View style={styles.daysCounterWrapper}>
              <Text style={styles.daysCounter}>
                {daysSober()} {daysSober() === 1 ? "day" : "days"} sober
              </Text>
            </View>

            {showPicker && !useToday && Platform.OS === "ios" && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                textColor="white"
              />
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinue}
              disabled={saving}
            >
              <LinearGradient
                colors={[accent, accentSoft]}
                style={styles.primaryGradient}
              >
                {saving ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.primaryText}>Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipWrapper} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, paddingHorizontal: 24, paddingTop: 48 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 44, height: 44, borderRadius: 10, marginRight: 12 },
  appName: { fontSize: 26, fontWeight: "800", color: textPrimary },
  appAccent: { color: accent },
  tagline: { marginTop: 6, fontSize: 14, color: textSecondary },

  cardContainer: { flex: 1, justifyContent: "center" },
  card: {
    backgroundColor: cardBackground,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
  },

  optionsContainer: { flexDirection: "row", gap: 12 },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(55,65,81,0.9)",
    backgroundColor: "rgba(15,23,42,0.5)",
    alignItems: "center",
  },
  optionButtonActive: {
    borderColor: accent,
    backgroundColor: "rgba(245,158,11,0.15)",
  },

  /** ✅ FIXED HERE **/
  optionButtonText: {
    color: "#E5E7EB", // light text on dark
    fontSize: 15,
    fontWeight: "600",
  },
  optionButtonTextActive: {
    color: accent,
  },

  daysCounterWrapper: { marginVertical: 20, alignItems: "center" },
  daysCounter: { fontSize: 32, color: accent, fontWeight: "700" },

  primaryButton: { marginTop: 12 },
  primaryGradient: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryText: { color: "#111827", fontSize: 16, fontWeight: "700" },

  skipWrapper: { marginTop: 10, alignItems: "center" },
  skipText: { color: "#9CA3AF", textDecorationLine: "underline" },
});

export default AddSobrietyDateScreen;
