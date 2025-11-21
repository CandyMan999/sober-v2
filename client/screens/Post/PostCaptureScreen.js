import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const PostCaptureScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.previewArea}>
        <Text style={styles.previewText}>Camera Preview Placeholder</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.primaryButton]}
          onPress={() => console.log("record")}
        >
          <Text style={styles.controlText}>Record</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => console.log("flip camera")}
        >
          <Text style={styles.controlText}>Flip Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => console.log("upload existing")}
        >
          <Text style={styles.controlText}>Upload</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 20,
  },
  closeText: {
    color: "#fff",
    fontSize: 18,
  },
  previewArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: {
    color: "#fff",
    fontSize: 18,
  },
  controls: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1f2937",
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: "#ef4444",
  },
  controlText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default PostCaptureScreen;
