// screens/Onboarding/HomeScreen.js
// Simple placeholder home screen that uses the shared color palette.
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

const { primaryBackground, textPrimary, textSecondary } = COLORS;

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sober Motivation</Text>
      <Text style={styles.subtitle}>This is your dummy Home screen. 🎉</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: textSecondary,
  },
});
