import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { useSubscription } from "@apollo/client/react";
import { formatDistanceToNow } from "date-fns";

import Avatar from "../../components/Avatar";
import Context from "../../context";
import {
  DELETE_DIRECT_ROOM,
  DIRECT_ROOM_UPDATED,
  MY_DIRECT_ROOMS,
} from "../../GraphQL/directMessages";
import { useClient } from "../../client";

const parseDateValue = (value) => {
  if (!value) return null;

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    const fromNumeric = new Date(numeric);
    if (!Number.isNaN(fromNumeric.getTime())) return fromNumeric;
  }

  const fromString = new Date(value);
  return Number.isNaN(fromString.getTime()) ? null : fromString;
};

const timeAgo = (timestamp) => {
  const parsed = parseDateValue(timestamp);
  if (!parsed) return "Just now";
  return `${formatDistanceToNow(parsed)} ago`;
};

const MessageListScreen = ({ route, navigation }) => {
  const { state } = useContext(Context);
  const currentUserId = state?.user?.id;
  const conversations = route?.params?.conversations || [];
  const client = useClient();

  const [rooms, setRooms] = useState(conversations || []);
  const [loading, setLoading] = useState(false);
  const [deletingRoomIds, setDeletingRoomIds] = useState({});

  const deriveLastMessageInfo = useCallback((room, fallbackIndex = 0) => {
    const lastComment = room?.comments?.[room.comments.length - 1];

    const lastMessageTimestamp =
      parseDateValue(room?.lastMessageAt) ||
      parseDateValue(room?.lastMessage?.createdAt) ||
      parseDateValue(lastComment?.createdAt);

    const lastActivity = lastMessageTimestamp
      ? lastMessageTimestamp.getTime()
      : Date.now() - fallbackIndex * 1000;

    const lastMessageText =
      room?.lastMessage?.text ||
      lastComment?.text ||
      room?.lastMessage ||
      "New chat";

    const lastMessageAuthorId =
      room?.lastMessage?.author?.id ||
      room?.lastMessage?.author?._id ||
      lastComment?.author?.id ||
      lastComment?.author?._id ||
      null;

    return {
      lastActivity,
      lastMessageText,
      lastMessageAuthorId,
    };
  }, []);

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
    // Intentionally empty dependency array to avoid duplicate room loads
    // when navigation props or the client reference changes.
  }, []);

  useSubscription(DIRECT_ROOM_UPDATED, {
    skip: !currentUserId,
    onData: ({ data: subscriptionData }) => {
      const updatedRoom = subscriptionData?.data?.directRoomUpdated;
      if (!updatedRoom) return;

      setRooms((prev) => {
        const filtered = prev.filter((room) => room.id !== updatedRoom.id);
        return [updatedRoom, ...filtered];
      });
    },
  });

  const handleDeleteRoom = useCallback(
    async (roomId) => {
      if (!roomId) return;

      const roomKey = String(roomId);
      if (deletingRoomIds[roomKey]) return;

      setDeletingRoomIds((prev) => ({ ...prev, [roomKey]: true }));

      try {
        await client.request(DELETE_DIRECT_ROOM, { roomId });
        setRooms((prev) =>
          prev.filter((room) => String(room.id || room._id) !== roomKey)
        );
      } catch (error) {
        console.log("Failed to delete direct room", error);
      } finally {
        setDeletingRoomIds((prev) => {
          const next = { ...prev };
          delete next[roomKey];
          return next;
        });
      }
    },
    [client, deletingRoomIds]
  );

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

        const { lastActivity, lastMessageText, lastMessageAuthorId } =
          deriveLastMessageInfo(room, index);
        return {
          id: room.id || room._id || `room-${index}`,
          user: otherUser,
          lastMessage: lastMessageText,
          lastActivity,
          lastMessageAuthorId,
          unread: false,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        return (b.lastActivity || 0) - (a.lastActivity || 0);
      });

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
  }, [rooms, conversations, currentUserId, deriveLastMessageInfo]);

  const renderConversation = ({ item }) => {
    const username = item.user?.username || "Buddy";
    const lastMessage = item.lastMessage || "New chat";
    const unread = Boolean(item.unread);
    const timestampLabel = timeAgo(item.lastActivity);
    const waitingForYou =
      !item.lastMessageAuthorId ||
      String(item.lastMessageAuthorId) !== String(currentUserId);
    const statusLabel = waitingForYou ? "Waiting for reply" : "Sent";
    const statusIcon = waitingForYou ? "alert-circle" : "checkmark-done";
    const statusColor = waitingForYou ? "#f59e0b" : "#38bdf8";
    const statusBackground = waitingForYou
      ? "rgba(245,158,11,0.12)"
      : "rgba(56,189,248,0.14)";
    const canDelete = item.user?.id;
    const roomKey = item.id?.toString();
    const isDeleting = roomKey ? Boolean(deletingRoomIds[roomKey]) : false;

    return (
      <Swipeable
        renderRightActions={
          canDelete
            ? (progress) => (
                <View style={styles.swipeActionsContainer}>
                  <Animated.View
                    style={[
                      styles.swipeActionCard,
                      {
                        transform: [
                          {
                            scale: progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1],
                              extrapolate: "clamp",
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.swipeAction}
                      onPress={() => handleDeleteRoom(item.id)}
                      disabled={isDeleting}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete conversation with ${username}`}
                    >
                      <View style={styles.swipeActionIcon}>
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#fecdd3" />
                        ) : (
                          <Ionicons name="trash" size={18} color="#fecdd3" />
                        )}
                      </View>
                      <Text style={styles.swipeActionText}>Delete</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )
            : undefined
        }
        overshootRight={false}
      >
        <TouchableOpacity
          style={[styles.row, unread && styles.unreadRow]}
          onPress={() =>
            canDelete && !isDeleting
              ? navigation.navigate("DirectMessage", { user: item.user })
              : null
          }
          activeOpacity={canDelete && !isDeleting ? 0.85 : 1}
          disabled={isDeleting}
        >
          <Avatar uri={item.user?.profilePicUrl} size={48} disableNavigation />
          <View style={styles.rowContent}>
            <View style={styles.rowHeader}>
              <View style={styles.rowLeft}>
                <Text style={[styles.username, unread && styles.usernameUnread]} numberOfLines={1}>
                  {username}
                </Text>
                <View style={styles.messageLine}>
                  <Ionicons name="chatbubble-ellipses" size={14} color="#94a3b8" />
                  <Text
                    style={[styles.lastMessage, unread && styles.lastMessageUnread]}
                    numberOfLines={1}
                  >
                    {lastMessage}
                  </Text>
                </View>
              </View>
              <View style={styles.rowMeta}>
                <Text style={styles.timestamp}>{timestampLabel}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusBackground }]}>
                  <Ionicons name={statusIcon} size={14} color={statusColor} />
                  <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
            </View>
          </View>
          {unread ? <View style={styles.unreadDot} /> : null}
        </TouchableOpacity>
      </Swipeable>
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
    gap: 4,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rowLeft: {
    flex: 1,
    gap: 6,
  },
  rowMeta: {
    marginLeft: 12,
    alignItems: "flex-end",
    gap: 6,
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
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
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
  swipeActionsContainer: {
    width: 120,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  swipeActionCard: {
    backgroundColor: "#111827",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    shadowColor: "#ef4444",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  swipeAction: {
    alignItems: "center",
    gap: 2,
  },
  swipeActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  swipeActionText: {
    color: "#fecdd3",
    fontWeight: "800",
    fontSize: 13,
  },
});

export default MessageListScreen;
