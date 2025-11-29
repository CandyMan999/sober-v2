import React, { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Avatar from "../../components/Avatar";

const timeAgo = (timestamp) => {
  if (!timestamp) return "Just now";
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "Just now";

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const MessageListScreen = ({ route, navigation }) => {
  const conversations = route?.params?.conversations || [];

  const listData = useMemo(() => {
    if (conversations.length) return conversations;

    return [
      {
        id: "welcome",
        user: {
          username: "Sober Support",
          profilePicUrl: null,
        },
        lastMessage: "Welcome! Start a chat with your buddies to stay accountable.",
        lastActivity: Date.now(),
        unread: true,
      },
    ];
  }, [conversations]);

  const renderConversation = ({ item }) => {
    const username = item.user?.username || "Buddy";
    const lastMessage = item.lastMessage || "New chat";
    const unread = Boolean(item.unread);
    const timestampLabel = timeAgo(item.lastActivity);

    return (
      <TouchableOpacity
        style={[styles.row, unread && styles.unreadRow]}
        onPress={() => navigation.navigate("DirectMessage", { user: item.user })}
        activeOpacity={0.85}
      >
        <Avatar uri={item.user?.profilePicUrl} size={48} disableNavigation />
        <View style={styles.rowContent}>
          <View style={styles.rowHeader}>
            <Text style={[styles.username, unread && styles.usernameUnread]} numberOfLines={1}>
              {username}
            </Text>
            <Text style={styles.timestamp}>{timestampLabel}</Text>
          </View>
          <View style={styles.messageLine}>
            <Ionicons name="chatbubble-ellipses" size={14} color="#94a3b8" />
            <Text style={[styles.lastMessage, unread && styles.lastMessageUnread]} numberOfLines={1}>
              {lastMessage}
            </Text>
          </View>
        </View>
        {unread ? <View style={styles.unreadDot} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          Direct conversations with your sober buddies
        </Text>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderConversation}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    backgroundColor: "#0b1220",
  },
  headerTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 13,
  },
  listContent: {
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#050816",
  },
  unreadRow: {
    backgroundColor: "rgba(245,158,11,0.06)",
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  username: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  usernameUnread: {
    color: "#f59e0b",
  },
  timestamp: {
    color: "#9ca3af",
    fontSize: 12,
  },
  messageLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lastMessage: {
    color: "#cbd5e1",
    fontSize: 13,
    flex: 1,
  },
  lastMessageUnread: {
    color: "#fef3c7",
    fontWeight: "600",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f59e0b",
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#0f172a",
    marginLeft: 76,
  },
});

export default MessageListScreen;
