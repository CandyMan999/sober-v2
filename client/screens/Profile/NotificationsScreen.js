import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const NotificationsScreen = ({ navigation }) => {
  const route = useRoute();
  const { alerts = [], username } = route.params || {};

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

        {alerts.length ? (
          <View style={styles.alertCard}>
            {alerts.map((alert, index) => (
              <View key={`${alert.id || index}`} style={styles.alertRow}>
                <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                <Text style={styles.alertText}>{alert.title || alert.message}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="notifications" size={28} color="#f59e0b" />
            </View>
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyDescription}>
              {username
                ? `${username} hasn't received any alerts yet.`
                : "When someone engages with you or you reach a milestone, you'll see it here."}
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation?.navigate?.("NotificationSettings")}
            >
              <Text style={styles.ctaLabel}>Manage alert settings</Text>
            </TouchableOpacity>
          </View>
        )}
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
  alertCard: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#111827",
    marginTop: 12,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
  },
  alertText: {
    color: "#e5e7eb",
    fontSize: 14,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#111827",
    marginTop: 12,
  },
  emptyIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(245,158,11,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#f3f4f6",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyDescription: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f59e0b",
    borderRadius: 12,
  },
  ctaLabel: {
    color: "#0b1220",
    fontWeight: "800",
  },
});

export default NotificationsScreen;
