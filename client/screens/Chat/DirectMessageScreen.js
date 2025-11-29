import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Avatar from "../../components/Avatar";

const DirectMessageScreen = ({ route, navigation }) => {
  const user = route?.params?.user || {};
  const username = user.username || "Buddy";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#f59e0b" />
        </TouchableOpacity>
        <View style={styles.headerUser}>
          <Avatar uri={user.profilePicUrl} size={40} disableNavigation />
          <View>
            <Text style={styles.headerTitle}>Direct Message</Text>
            <Text style={styles.headerSubtitle}>{username}</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.placeholderText}>
          Start a conversation with {username}. Messaging is coming soon!
        </Text>
      </View>

      <View style={styles.inputBar}>
        <Text style={styles.inputPlaceholder}>Type a message...</Text>
        <Ionicons name="send" size={18} color="#f59e0b" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  backButton: {
    marginRight: 10,
    padding: 6,
    borderRadius: 10,
    backgroundColor: "rgba(245,158,11,0.1)",
  },
  headerUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  inputPlaceholder: {
    color: "#9ca3af",
    fontSize: 14,
  },
});

export default DirectMessageScreen;
