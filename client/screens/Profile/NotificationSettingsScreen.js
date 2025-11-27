import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const NotificationSettingsScreen = ({ navigation }) => {
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [emailEnabled, setEmailEnabled] = React.useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={20} color="#e5e7eb" />
          </TouchableOpacity>
          <Text style={styles.title}>Notification Settings</Text>
        </View>
        <Text style={styles.subtitle}>
          Toggle how you want to stay up-to-date with your buddies and posts.
        </Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Feather name="bell" size={18} color="#f59e0b" />
            <Text style={styles.rowLabel}>Push notifications</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            thumbColor="#f59e0b"
            trackColor={{ true: "#fcd34d", false: "#374151" }}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Feather name="mail" size={18} color="#60a5fa" />
            <Text style={styles.rowLabel}>Email digests</Text>
          </View>
          <Switch
            value={emailEnabled}
            onValueChange={setEmailEnabled}
            thumbColor="#60a5fa"
            trackColor={{ true: "#bfdbfe", false: "#374151" }}
          />
        </View>

        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaText}>Save Preferences</Text>
        </TouchableOpacity>
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
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    color: "#e5e7eb",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0b1220",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#111827",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowLabel: {
    color: "#e5e7eb",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  ctaButton: {
    marginTop: 24,
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  ctaText: {
    color: "#0b1220",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default NotificationSettingsScreen;
