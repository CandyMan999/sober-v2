import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const NotificationsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
            accessibilityLabel="Go back to profile"
          >
            <Feather name="arrow-left" size={20} color="#e5e7eb" />
            <Text style={styles.backLabel}>Profile</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <Text style={styles.subtitle}>Your notifications inbox will live here.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050816",
  },
  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  backLabel: {
    color: "#e5e7eb",
    marginLeft: 6,
    fontWeight: "700",
  },
  title: {
    color: "#f3f4f6",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 16,
    lineHeight: 22,
  },
});

export default NotificationsScreen;
