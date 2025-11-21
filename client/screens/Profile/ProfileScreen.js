import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.avatar} />
      <Text style={styles.username}>Username: [placeholder]</Text>
      <Text style={styles.detail}>Days sober: [placeholder]</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log("Edit Profile")}
      >
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log("Notification Settings")}
      >
        <Text style={styles.buttonText}>Notification Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log("About / Help")}
      >
        <Text style={styles.buttonText}>About / Help</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#0b1220",
    paddingTop: 60,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1f2937",
    marginBottom: 16,
  },
  username: {
    color: "#f3f4f6",
    fontSize: 18,
    marginBottom: 4,
  },
  detail: {
    color: "#9ca3af",
    marginBottom: 20,
  },
  button: {
    width: "80%",
    padding: 14,
    backgroundColor: "#111827",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
    alignItems: "center",
  },
  buttonText: {
    color: "#e5e7eb",
    fontWeight: "600",
  },
});

export default ProfileScreen;
