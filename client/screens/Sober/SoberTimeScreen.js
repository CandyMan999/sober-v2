import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

const SoberTimeScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sober Time</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Days sober: ___</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next milestone: ___ days</Text>
        <Text style={styles.cardText}>Recent milestones: [placeholder list]</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Relapse history (placeholder list)</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => console.log("Reset Sober Time (placeholder)")}
        >
          <Text style={styles.buttonText}>Reset Sober Time (placeholder)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => console.log("Add Relapse (placeholder)")}
        >
          <Text style={styles.buttonText}>Add Relapse (placeholder)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardTitle: {
    color: "#f3f4f6",
    fontSize: 18,
    marginBottom: 4,
  },
  cardText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  buttonRow: {
    marginTop: 12,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  secondaryButton: {
    backgroundColor: "#4b5563",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default SoberTimeScreen;
