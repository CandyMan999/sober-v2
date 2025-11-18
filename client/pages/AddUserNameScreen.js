import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const PRIMARY_BG = "#050816";
const CARD_BG = "rgba(15,23,42,0.96)";
const ACCENT = "#F59E0B"; // golden orange
const ACCENT_SOFT = "#FBBF24";

const MIN_LEN = 3;

const UsernameScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const isValid = username.trim().length >= MIN_LEN;

  const handleContinue = async () => {
    if (!isValid || saving) return;

    try {
      setSaving(true);

      // TODO: call mutation to upsert username here
      // await upsertUserProfile({ variables: { token, username: username.trim() } });

      navigation.navigate("AddPhoto", { username: username.trim() });
    } catch (err) {
      console.log("Error saving username:", err);
      // you could add a toast / inline error here later
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={["#020617", "#020617", "#111827"]}
      style={styles.root}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top badge / brand */}
        <View style={styles.header}>
          <Text style={styles.appName}>
            sober <Text style={styles.appAccent}>motivation</Text>
          </Text>
          <Text style={styles.tagline}>
            Build a life you don’t want to numb.
          </Text>
        </View>

        {/* Main card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Step 1 of 2</Text>

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
              maxLength={32}
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
            style={[
              styles.button,
              (!isValid || saving) && styles.buttonDisabled,
            ]}
            activeOpacity={0.9}
            disabled={!isValid || saving}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={
                !isValid || saving
                  ? ["#4B5563", "#4B5563"]
                  : [ACCENT, ACCENT_SOFT]
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

        {/* Bottom micro-copy */}
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
});

export default UsernameScreen;
