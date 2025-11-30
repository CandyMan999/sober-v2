import React, { useContext, useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSubscription } from "@apollo/client/react";

import Avatar from "../../components/Avatar";
import Context from "../../context";
import {
  DIRECT_ROOM_UPDATED,
  MY_DIRECT_ROOMS,
} from "../../GraphQL/directMessages";
import { useClient } from "../../client";

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
  const { state } = useContext(Context);
  const currentUserId = state?.user?.id;
  const conversations = route?.params?.conversations || [];
  const client = useClient();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;

    let isMounted = true;
    setLoading(true);

    client
      .request(MY_DIRECT_ROOMS)
      .then((result) => {
        if (!isMounted) return;
        setRooms(result?.myDirectRooms || []);
      })
      .catch((error) => {
        console.log("Failed to load direct rooms", error);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [client, currentUserId]);

  useSubscription(DIRECT_ROOM_UPDATED, {
    skip: !currentUserId,
    onData: ({ data: subscriptionData }) => {
      const updatedRoom = subscriptionData?.data?.directRoomUpdated;
      if (!updatedRoom) return;

      setRooms((prev) => {
        const filtered = prev.filter((room) => room.id !== updatedRoom.id);
        return [updatedRoom, ...filtered].sort(
          (a, b) =>
            new Date(b.lastMessageAt || b.lastMessage?.createdAt || 0) -
            new Date(a.lastMessageAt || a.lastMessage?.createdAt || 0)
        );
      });
    },
  });

  const listData = useMemo(() => {
    const sourceRooms = rooms.length ? rooms : conversations;

    const normalized = sourceRooms
      .map((room, index) => {
        const participants = room.users || [];
        const otherUserRaw =
          participants.find(
            (participant) =>
              participant && String(participant.id || participant._id) !== String(currentUserId)
          ) ||
          participants.find(Boolean) ||
          room.user;

        const otherUser = otherUserRaw
          ? { ...otherUserRaw, id: otherUserRaw.id || otherUserRaw._id }
          : null;

        if (!otherUser?.id) return null;

        const lastMessageText = room.lastMessage?.text || room.lastMessage || "New chat";
        const lastActivity =
          room.lastMessageAt || room.lastMessage?.createdAt || Date.now() - index * 1000;

        return {
          id: room.id || room._id || `room-${index}`,
          user: otherUser,
          lastMessage: lastMessageText,
          lastActivity,
          unread: room.unread || false,
        };
      })
      .filter(Boolean);

    if (!normalized.length) {
      return [
        {
          id: "welcome",
          user: {
            username: "Sober Support",
            profilePicUrl: null,
          },
          lastMessage:
            "Welcome! Start a chat with your buddies to stay accountable.",
          lastActivity: Date.now(),
          unread: true,
        },
      ];
    }

    return normalized;
  }, [rooms, conversations, currentUserId]);

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
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#fbbf24" />
          </TouchableOpacity>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              Direct conversations with your sober buddies
            </Text>
          </View>
        </View>
      </View>

      {loading && !rooms.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#fbbf24" />
        </View>
      ) : null}

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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  headerTextBlock: {
    flex: 1,
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
  loadingContainer: {
    paddingVertical: 8,
    alignItems: "center",
  },
});

export default MessageListScreen;
