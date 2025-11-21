import React from "react";
import { View, Text, StyleSheet } from "react-native";

const CommentSheet = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comments Placeholder</Text>
      <Text style={styles.comment}>User1: This is awesome!</Text>
      <Text style={styles.comment}>User2: Keep going!</Text>
      <View style={styles.inputRow}>
        <Text style={styles.inputPlaceholder}>Add a comment... (placeholder)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  title: {
    color: "#111827",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  comment: {
    color: "#1f2937",
    fontSize: 14,
    marginBottom: 4,
  },
  inputRow: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  inputPlaceholder: {
    color: "#6b7280",
  },
});

export default CommentSheet;
