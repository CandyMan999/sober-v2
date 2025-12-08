import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { formatDistanceToNow } from "date-fns";
import { LiquidGlassView } from "@callstack/liquid-glass";

import Avatar from "../../components/Avatar";
import Context from "../../context";
import {
  DELETE_DIRECT_ROOM,
  DIRECT_MESSAGE_SUBSCRIPTION,
  DIRECT_ROOM_UPDATED,
  DIRECT_ROOM_WITH_USER,
  MY_DIRECT_ROOMS,
} from "../../GraphQL/directMessages";
import { useClient } from "../../client";
import { GRAPHQL_URI } from "../../config/endpoint";

const buildWsUrl = () => GRAPHQL_URI.replace(/^http/, "ws");

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

const SOBER_COMPANION_ID = "693394413ea6a3e530516505";

const resolveRoomId = (room) => {
  if (!room) return null;
  return room.id || room._id || room.roomId || null;
};

const enrichMessageAuthor = (message, participants = [], selfUser) => {
  if (!message) return message;

  const authorId =
    message?.author?.id || message?.author?._id || message?.authorId || null;

  const participant = participants.find(
    (user) => String(user?.id || user?._id) === String(authorId)
  );

  const profilePicUrl =
    message?.author?.profilePicUrl ||
    participant?.profilePicUrl ||
    (selfUser && String(selfUser?.id) === String(authorId)
      ? selfUser.profilePicUrl
      : null);

  const username =
    message?.author?.username ||
    participant?.username ||
    (selfUser && String(selfUser?.id) === String(authorId)
      ? selfUser.username
      : undefined);

  const normalizedAuthor =
    message.author ||
    participant ||
    (authorId
      ? {
          id: authorId,
        }
      : null);

  return {
    ...message,
    author: normalizedAuthor
      ? {
          ...normalizedAuthor,
          id:
            normalizedAuthor.id ||
            normalizedAuthor._id ||
            message?.author?.id ||
            message?.author?._id,
          username,
          profilePicUrl,
        }
      : null,
  };
};

const MessageListScreen = ({ route, navigation }) => {
  const { state } = useContext(Context);
  const currentUserId = state?.user?.id;
  const conversations = route?.params?.conversations || [];
  const client = useClient();

  const [rooms, setRooms] = useState(conversations || []);
  const [companionUser, setCompanionUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingRoomIds, setDeletingRoomIds] = useState({});
  const [activeRoomIds, setActiveRoomIds] = useState([]);
  const [wsReadyKey, setWsReadyKey] = useState(0);
  const wsClientRef = useRef(null);
  const directMessageSubscriptions = useRef({});
  const directRoomUpdatedSubscription = useRef(null);

  const deriveLastMessageInfo = useCallback((room, fallbackIndex = 0) => {
    const lastComment = room?.comments?.[room.comments.length - 1];

    const lastMessageTimestamp =
      parseDateValue(room?.lastMessageAt) ||
      parseDateValue(room?.lastMessage?.createdAt) ||
      parseDateValue(lastComment?.createdAt);

    const lastMessageIsRead =
      typeof room?.lastMessage?.isRead === "boolean"
        ? room.lastMessage.isRead
        : typeof lastComment?.isRead === "boolean"
        ? lastComment.isRead
        : false;

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
      lastMessageIsRead,
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

  useEffect(() => {
    if (!currentUserId) return undefined;

    const wsUrl = buildWsUrl();
    let wsClient;

    try {
      wsClient = new SubscriptionClient(wsUrl, { reconnect: true });
      wsClientRef.current = wsClient;
      setWsReadyKey((key) => key + 1);
    } catch (error) {
      console.log("direct room list ws init failed", error);
      return undefined;
    }

    return () => {
      Object.keys(directMessageSubscriptions.current).forEach((roomId) => {
        directMessageSubscriptions.current[roomId]?.unsubscribe?.();
        delete directMessageSubscriptions.current[roomId];
      });

      directRoomUpdatedSubscription.current?.unsubscribe?.();
      directRoomUpdatedSubscription.current = null;

      wsClientRef.current?.close?.();
      wsClientRef.current = null;
    };
  }, [currentUserId]);

  useEffect(() => {
    const roomIds = Array.from(
      new Set(
        rooms
          .map((room) => resolveRoomId(room))
          .filter(Boolean)
          .map((id) => id.toString())
      )
    );

    setActiveRoomIds((prev) => {
      const prevKey = prev.join(",");
      const nextKey = roomIds.join(",");

      if (prevKey === nextKey) return prev;

      return roomIds;
    });
  }, [rooms]);

  useEffect(() => {
    const wsClient = wsClientRef.current;

    if (!currentUserId || !wsClient) return;

    const active = directMessageSubscriptions.current;

    Object.keys(active).forEach((roomId) => {
      if (!activeRoomIds.includes(roomId)) {
        active[roomId]?.unsubscribe?.();
        delete active[roomId];
      }
    });

    activeRoomIds.forEach((roomId) => {
      if (active[roomId]) return;

      const messageObservable = wsClient.request({
        query: DIRECT_MESSAGE_SUBSCRIPTION,
        variables: { roomId },
      });

      const subscription = messageObservable.subscribe({
        next: ({ data }) => {
          const message = data?.directMessageReceived;
          if (!message) return;

          setRooms((prev) => {
            const targetIndex = prev.findIndex(
              (room) => String(resolveRoomId(room)) === String(roomId)
            );

            if (targetIndex === -1) return prev;

            const existing = prev[targetIndex];
            const normalizedMessage = enrichMessageAuthor(
              message,
              existing?.users,
              state?.user
            );
            const existingComments = Array.isArray(existing.comments)
              ? existing.comments
              : [];

            const incomingId = message?.id || message?._id;
            const nextComments = existingComments.some(
              (comment) => String(comment?.id || comment?._id) === String(incomingId)
            )
              ? existingComments.map((comment) =>
                  String(comment?.id || comment?._id) === String(incomingId)
                    ? { ...comment, ...normalizedMessage }
                    : comment
                )
              : [...existingComments, normalizedMessage];

            const mergedUsers = Array.isArray(existing?.users)
              ? existing.users.map((user) =>
                  String(user?.id || user?._id) ===
                  String(normalizedMessage?.author?.id || normalizedMessage?.author?._id)
                    ? {
                        ...user,
                        profilePicUrl:
                          user?.profilePicUrl || normalizedMessage?.author?.profilePicUrl,
                        username: user?.username || normalizedMessage?.author?.username,
                      }
                    : user
                )
              : [];

            const authorId =
              normalizedMessage?.author?.id || normalizedMessage?.author?._id;
            const hasAuthor = mergedUsers.some(
              (user) => String(user?.id || user?._id) === String(authorId)
            );

            const mergedRoom = {
              ...existing,
              users:
                hasAuthor || !normalizedMessage?.author
                  ? mergedUsers
                  : [...mergedUsers, normalizedMessage.author],
              comments: nextComments,
              lastMessage: normalizedMessage,
              lastMessageAt:
                normalizedMessage?.createdAt || existing.lastMessageAt,
            };

            const remaining = prev.filter((_, index) => index !== targetIndex);
            const nextRooms = [mergedRoom, ...remaining];

            return nextRooms.sort((a, b) => {
              const aTime =
                parseDateValue(a.lastMessageAt)?.getTime?.() ||
                parseDateValue(a.lastMessage?.createdAt)?.getTime?.() ||
                0;
              const bTime =
                parseDateValue(b.lastMessageAt)?.getTime?.() ||
                parseDateValue(b.lastMessage?.createdAt)?.getTime?.() ||
                0;
              return bTime - aTime;
            });
          });
        },
        error: (error) => {
          console.log("direct message subscription error", error);
        },
      });

      active[roomId] = subscription;
    });

    return () => {
      Object.keys(active).forEach((roomId) => {
        active[roomId]?.unsubscribe?.();
        delete active[roomId];
      });
    };
  }, [currentUserId, activeRoomIds, wsReadyKey]);

  useEffect(() => {
    if (!currentUserId) return;

    let isMounted = true;

    client
      .request(DIRECT_ROOM_WITH_USER, { userId: SOBER_COMPANION_ID })
      .then((result) => {
        if (!isMounted) return;

        const room = result?.directRoomWithUser;
        if (!room) return;

        const participants = room.users || [];
        const companion = participants.find(
          (participant) =>
            String(participant?.id || participant?._id) ===
            String(SOBER_COMPANION_ID)
        );

        if (companion?.id || companion?._id) {
          setCompanionUser({
            ...companion,
            id: companion.id || companion._id,
            username: companion.username || "SoberOwl",
          });
        }

        setRooms((prev) => {
          const roomId = room.id || room._id;
          const normalizedRoom = roomId ? { ...room, id: roomId } : room;
          const filtered = prev.filter(
            (existing) => String(existing.id || existing._id) !== String(roomId)
          );
          return [normalizedRoom, ...filtered];
        });
      })
      .catch((error) => {
        console.log("Failed to ensure companion room", error);
      });

    return () => {
      isMounted = false;
    };
  }, [client, currentUserId]);

  useEffect(() => {
    const wsClient = wsClientRef.current;

    if (!currentUserId || !wsClient) return undefined;

    const roomUpdatedObservable = wsClient.request({
      query: DIRECT_ROOM_UPDATED,
    });

    const subscription = roomUpdatedObservable.subscribe({
      next: ({ data: subscriptionData }) => {
        const updatedRoom = subscriptionData?.directRoomUpdated;
        if (!updatedRoom) return;

        setRooms((prev) => {
          const updatedId = resolveRoomId(updatedRoom);
          if (!updatedId) return prev;

          const existing = prev.find(
            (room) => resolveRoomId(room) === updatedId
          );

          const incomingComments = Array.isArray(updatedRoom.comments)
            ? updatedRoom.comments
            : undefined;

          const mergedComments =
            incomingComments !== undefined
              ? incomingComments
              : existing?.comments || [];

          const mergedLastMessage = updatedRoom.lastMessage
            ? { ...updatedRoom.lastMessage }
            : existing?.lastMessage;

          const mergedLastMessageAt =
            updatedRoom.lastMessageAt ||
            mergedLastMessage?.createdAt ||
            existing?.lastMessageAt;

          const mergedRoom = {
            ...(existing || {}),
            ...updatedRoom,
            id: updatedId,
            users: updatedRoom.users || existing?.users || [],
            comments: mergedComments,
            lastMessage: mergedLastMessage,
            lastMessageAt: mergedLastMessageAt,
          };

          const nextRooms = prev
            .filter((room) => resolveRoomId(room) !== updatedId)
            .concat(mergedRoom);

          return nextRooms.sort((a, b) => {
            const aTime =
              parseDateValue(a.lastMessageAt)?.getTime?.() ||
              parseDateValue(a.lastMessage?.createdAt)?.getTime?.() ||
              0;
            const bTime =
              parseDateValue(b.lastMessageAt)?.getTime?.() ||
              parseDateValue(b.lastMessage?.createdAt)?.getTime?.() ||
              0;
            return bTime - aTime;
          });
        });
      },
      error: (error) => {
        console.log("direct room updated subscription error", error);
      },
    });

    directRoomUpdatedSubscription.current = subscription;

    return () => {
      subscription?.unsubscribe?.();
      directRoomUpdatedSubscription.current = null;
    };
  }, [currentUserId, wsReadyKey]);

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
    const normalized = rooms
      .map((room, index) => {
        const roomId = resolveRoomId(room);
        const participants = room.users || [];
        const otherUserRaw =
          participants.find(
            (participant) =>
              participant &&
              String(participant.id || participant._id) !==
                String(currentUserId)
          ) ||
          participants.find(Boolean) ||
          room.user;

        const isCompanionUser =
          otherUserRaw &&
          String(otherUserRaw.id || otherUserRaw._id) ===
            String(SOBER_COMPANION_ID);

        const otherUser = otherUserRaw
          ? {
              ...otherUserRaw,
              id: otherUserRaw.id || otherUserRaw._id,
              username:
                otherUserRaw.username ||
                (isCompanionUser ? "SoberOwl" : "Buddy"),
            }
          : null;

        if (!otherUser?.id) return null;

        const { lastActivity, lastMessageText, lastMessageAuthorId, lastMessageIsRead } =
          deriveLastMessageInfo(room, index);
        return {
          id: roomId || `room-${index}`,
          user: otherUser,
          lastMessage: lastMessageText,
          lastActivity,
          lastMessageAuthorId,
          lastMessageIsRead,
          unread: false,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        return (b.lastActivity || 0) - (a.lastActivity || 0);
      });

    const companionProfile = companionUser || {
      id: SOBER_COMPANION_ID,
      username: "SoberOwl",
    };

    const hasCompanion = normalized.some(
      (conversation) =>
        String(conversation?.user?.id) === String(SOBER_COMPANION_ID)
    );

    if (!hasCompanion) {
      normalized.unshift({
        id: `room-${SOBER_COMPANION_ID}`,
        user: companionProfile,
        lastMessage:
          "Chat with your sober AI companion anytime you need encouragement.",
        lastActivity: Date.now(),
        lastMessageAuthorId: null,
        lastMessageIsRead: true,
        unread: false,
      });
    }

    return normalized;
  }, [rooms, currentUserId, deriveLastMessageInfo]);

  const renderConversation = ({ item }) => {
    const isCompanion = String(item.user?.id) === String(SOBER_COMPANION_ID);
    const username =
      item.user?.username || (isCompanion ? "SoberOwl" : "Buddy");
    const lastMessage = item.lastMessage || "New chat";
    const unread = Boolean(item.unread);
    const timestampLabel = timeAgo(item.lastActivity);
    const waitingForYou = isCompanion
      ? false
      : !item.lastMessageAuthorId ||
        String(item.lastMessageAuthorId) !== String(currentUserId);
    const wasReadByThem =
      !isCompanion &&
      String(item.lastMessageAuthorId) === String(currentUserId) &&
      item.lastMessageIsRead;
    const statusLabel = isCompanion
      ? "Always here"
      : wasReadByThem
      ? "Read"
      : waitingForYou
      ? "Waiting for reply"
      : "Sent";
    const statusIcon = isCompanion
      ? "moon"
      : wasReadByThem
      ? "checkmark-done"
      : waitingForYou
      ? "alert-circle"
      : "checkmark-done";
    const statusColor = isCompanion
      ? "#34d399"
      : wasReadByThem
      ? "#cbd5e1"
      : waitingForYou
      ? "#f59e0b"
      : "#38bdf8";
    const statusBackground = isCompanion
      ? "rgba(52,211,153,0.12)"
      : wasReadByThem
      ? "rgba(148,163,184,0.16)"
      : waitingForYou
      ? "rgba(245,158,11,0.12)"
      : "rgba(56,189,248,0.14)";
    const canOpen = Boolean(item.user?.id);
    const canDelete = canOpen && !isCompanion;
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
          onPress={() =>
            canOpen && !isDeleting
              ? navigation.navigate("DirectMessage", { user: item.user })
              : null
          }
          activeOpacity={canOpen && !isDeleting ? 0.85 : 1}
          disabled={isDeleting}
        >
          <LiquidGlassView
            interactive
            effect="clear"
            colorScheme="system"
            tintColor={
              unread ? "rgba(245,158,11,0.22)" : "rgba(148,163,184,0.14)"
            }
            style={[styles.row, unread && styles.unreadRow]}
          >
            <Avatar
              uri={item.user?.profilePicUrl}
              size={isCompanion ? 54 : 48}
              disableNavigation
              fallbackSource={
                isCompanion ? require("../../assets/icon.png") : undefined
              }
              haloColors={
                isCompanion ? ["#bef264", "#34d399", "#22d3ee"] : undefined
              }
            />
            <View style={styles.rowContent}>
              <View style={styles.rowHeader}>
                <View style={styles.rowLeft}>
                  <View style={styles.nameLine}>
                    <Text
                      style={[styles.username, unread && styles.usernameUnread]}
                      numberOfLines={1}
                    >
                      {username}
                    </Text>
                  </View>
                  <View style={styles.messageLine}>
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={14}
                      color="#94a3b8"
                    />
                    <Text
                      style={[
                        styles.lastMessage,
                        unread && styles.lastMessageUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {lastMessage}
                    </Text>
                  </View>
                  {isCompanion ? (
                    <View style={styles.metaBottom}>
                      <View style={styles.companionChip}>
                        <Ionicons
                          name="shield-checkmark"
                          size={12}
                          color="#0f172a"
                        />
                        <Text style={styles.companionChipText}>
                          Sobriety Coach
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
                <View style={styles.rowMeta}>
                  <View style={styles.metaTop}>
                    <Text style={styles.timestamp}>{timestampLabel}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: statusBackground },
                      ]}
                    >
                      <Ionicons name={statusIcon} size={14} color={statusColor} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            {unread ? <View style={styles.unreadDot} /> : null}
          </LiquidGlassView>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/icon.png")}
      resizeMode="contain"
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <View pointerEvents="none" style={styles.backgroundOverlay} />
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
          ListEmptyComponent={() =>
            !loading ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrapper}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={26}
                    color="#cbd5e1"
                  />
                </View>
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start a chat with your sober buddies or message SoberOwl for
                  a quick boost.
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#050816",
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,22,0.86)",
  },
  backgroundImage: {
    opacity: 0.06,
    width: 320,
    height: 320,
    alignSelf: "center",
    top: "12%",
  },
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
    paddingHorizontal: 10,
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(5,8,22,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },
  unreadRow: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.28)",
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  rowLeft: {
    flex: 1,
    gap: 6,
  },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowMeta: {
    marginLeft: 12,
    alignSelf: "stretch",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  metaTop: {
    alignItems: "flex-end",
    gap: 6,
  },
  metaBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
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
  companionChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  companionChipText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
    textTransform: "uppercase",
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
  emptyState: {
    flex: 1,
    minHeight: 340,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(148,163,184,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
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
