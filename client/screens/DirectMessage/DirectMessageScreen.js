import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

// 🔑 use the raw ws client instead of Apollo's useSubscription
import { SubscriptionClient } from "subscriptions-transport-ws";

import Avatar from "../../components/Avatar";
import Context from "../../context";
import {
  DIRECT_MESSAGE_SUBSCRIPTION,
  DIRECT_ROOM_WITH_USER,
  SEND_DIRECT_MESSAGE,
  SET_DIRECT_TYPING,
  DIRECT_TYPING_SUBSCRIPTION,
} from "../../GraphQL/directMessages";
import { useClient } from "../../client";
import { GRAPHQL_URI } from "../../config/endpoint";

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

const formatTime = (timestamp) => {
  const parsed = parseDateValue(timestamp);
  if (!parsed) return "Just now";
  return `${formatDistanceToNow(parsed)} ago`;
};

// Helper to build WS URL (http -> ws, https -> wss)
const buildWsUrl = () => GRAPHQL_URI.replace(/^http/, "ws");

const DirectMessageScreen = ({ route, navigation }) => {
  const { state } = useContext(Context);
  const client = useClient();
  const currentUserId = state?.user?.id;
  const user = route?.params?.user || {};
  const targetUserId = user?.id;
  const username = user.username || "Buddy";

  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(null);
  const listRef = useRef(null);
  const previousCount = useRef(0);
  const typingStatusRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const indicatorTimeoutRef = useRef(null);
  const typingDots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const typingLoop = useRef(null);

  useEffect(() => {
    const wave = (value) =>
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0.2,
          duration: 260,
          useNativeDriver: true,
        }),
      ]);

    typingLoop.current?.stop();
    typingDots.forEach((value) => value.setValue(0));

    typingLoop.current = Animated.loop(
      Animated.stagger(140, typingDots.map((value) => wave(value))),
      { resetBeforeIteration: true }
    );

    return () => {
      typingLoop.current?.stop();
      typingDots.forEach((value) => value.setValue(0));
    };
  }, [typingDots]);

  const syncMessagesFromRoom = useCallback((roomData) => {
    if (!roomData?.comments) return;

    setMessages((prev) => {
      const incomingById = new Map(prev.map((msg) => [msg.id, msg]));
      roomData.comments.forEach((msg) => {
        incomingById.set(msg.id, msg);
      });

      return [...incomingById.values()].sort(
        (a, b) =>
          (parseDateValue(a.createdAt)?.getTime() || 0) -
          (parseDateValue(b.createdAt)?.getTime() || 0)
      );
    });
  }, []);

  useEffect(() => {
    if (typingIndicator?.isTyping) {
      typingLoop.current?.stop();
      typingDots.forEach((value) => value.setValue(0));
      typingLoop.current?.reset?.();
      typingLoop.current?.start();
    } else {
      typingLoop.current?.stop();
      typingDots.forEach((value) => value.setValue(0));
    }
  }, [typingIndicator, typingDots]);

  // 1) Load the room + initial messages
  useEffect(() => {
    if (!targetUserId || !currentUserId) return;

    let isMounted = true;
    setLoading(true);

    const loadRoom = async () => {
      try {
        const result = await client.request(DIRECT_ROOM_WITH_USER, {
          userId: targetUserId,
        });

        const room = result?.directRoomWithUser;
        console.log("[DM] Room result:", room);

        if (!isMounted || !room) return;

        if (room?.id || room?._id) {
          const id = room.id || room._id;
          setRoomId(id);
        }

        syncMessagesFromRoom(room);
      } catch (error) {
        console.error("Failed to load direct room", error);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadRoom();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Manual WebSocket subscription using SubscriptionClient
  useEffect(() => {
    if (!roomId) return;

    console.log("[DM] Setting up WS subscription for room:", roomId);

    const wsUrl = buildWsUrl();

    // NOTE: no auth checks on the server for this subscription right now,
    // so we don't have to send tokens here.
    const wsClient = new SubscriptionClient(wsUrl, {
      reconnect: true,
    });

    const messageObservable = wsClient.request({
      query: DIRECT_MESSAGE_SUBSCRIPTION,
      variables: { roomId },
    });

    const messageSubscription = messageObservable.subscribe({
      next: ({ data }) => {
        try {
          const incoming = data?.directMessageReceived;
          console.log("[DM] WS incoming:", incoming);

          if (!incoming) return;

          setMessages((prev) => {
            if (prev.find((msg) => msg.id === incoming.id)) return prev;
            return [...prev, incoming].sort(
              (a, b) =>
                (parseDateValue(a.createdAt)?.getTime() || 0) -
                (parseDateValue(b.createdAt)?.getTime() || 0)
            );
          });
        } catch (err) {
          console.error("[DM] WS subscription handler failed:", err);
        }
      },
      error: (err) => {
        console.error("[DM] WS subscription error:", err);
      },
      complete: () => {
        console.log("[DM] WS subscription completed");
      },
    });

    const typingObservable = wsClient.request({
      query: DIRECT_TYPING_SUBSCRIPTION,
      variables: { roomId },
    });

    const typingSubscription = typingObservable.subscribe({
      next: ({ data }) => {
        try {
          const typing = data?.directTyping;
          if (!typing || String(typing.userId) === String(currentUserId)) return;

          setTypingIndicator(typing.isTyping ? typing : null);

          if (indicatorTimeoutRef.current) {
            clearTimeout(indicatorTimeoutRef.current);
          }

          if (typing.isTyping) {
            indicatorTimeoutRef.current = setTimeout(() => {
              setTypingIndicator(null);
            }, 4000);
          } else {
            indicatorTimeoutRef.current = null;
          }
        } catch (err) {
          console.error("[DM] Typing subscription handler failed:", err);
        }
      },
      error: (err) => {
        console.error("[DM] Typing subscription error:", err);
      },
    });

    return () => {
      console.log("[DM] Cleaning up WS subscription");
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
      wsClient.close(false);
    };
  }, [currentUserId, roomId]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          (parseDateValue(a.createdAt)?.getTime() || 0) -
          (parseDateValue(b.createdAt)?.getTime() || 0)
      ),
    [messages]
  );

  useEffect(() => {
    const shouldScroll = sortedMessages.length > previousCount.current;
    previousCount.current = sortedMessages.length;

    if (shouldScroll) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [sortedMessages.length]);

  const sendTypingStatus = useCallback(
    async (isTyping) => {
      if (!roomId) return;

      try {
        typingStatusRef.current = isTyping;
        await client.request(SET_DIRECT_TYPING, { roomId, isTyping });
      } catch (err) {
        console.error("Failed to publish typing status", err);
      }
    },
    [client, roomId]
  );

  const handleTextChange = useCallback(
    (value) => {
      setMessageText(value);
      if (!roomId) return;

      const trimmed = value.trim();

      if (trimmed && !typingStatusRef.current) {
        sendTypingStatus(true);
      }

      if (!trimmed && typingStatusRef.current) {
        sendTypingStatus(false);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (trimmed) {
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingStatus(false);
        }, 2500);
      }
    },
    [roomId, sendTypingStatus]
  );

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current);
      }

      if (typingStatusRef.current && roomId) {
        sendTypingStatus(false);
      }
    },
    [roomId, sendTypingStatus]
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        typingLoop.current?.stop();
        typingDots.forEach((value) => value.setValue(0));
        setTypingIndicator(null);

        if (typingStatusRef.current && roomId) {
          sendTypingStatus(false);
        }
      };
    }, [roomId, sendTypingStatus, typingDots])
  );

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || !targetUserId || !currentUserId) return;

    try {
      setSending(true);

      const response = await client.request(SEND_DIRECT_MESSAGE, {
        recipientId: targetUserId,
        text,
      });

      const newMessage = response?.sendDirectMessage;
      if (newMessage) {
        setMessages((prev) => {
          if (prev.find((msg) => msg.id === newMessage.id)) return prev;
          return [...prev, newMessage].sort(
            (a, b) =>
              (parseDateValue(a.createdAt)?.getTime() || 0) -
              (parseDateValue(b.createdAt)?.getTime() || 0)
          );
        });
      }

      setMessageText("");
      if (typingStatusRef.current) {
        await sendTypingStatus(false);
      }
    } catch (err) {
      console.error("Failed to send direct message", err);
    } finally {
      setSending(false);
    }
  }, [client, currentUserId, messageText, sendTypingStatus, targetUserId]);

  const renderMessage = ({ item }) => {
    const isMine = String(item.author?.id) === String(currentUserId);

    return (
      <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
        {!isMine && (
          <Avatar
            uri={item.author?.profilePicUrl}
            size={34}
            disableNavigation
            style={styles.messageAvatar}
          />
        )}
        <View style={[styles.bubbleStack, isMine && styles.bubbleStackMine]}>
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleTheirs,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMine ? styles.messageTextMine : styles.messageTextTheirs,
              ]}
            >
              {item.text}
            </Text>
            <Text style={[styles.timestamp, isMine && styles.timestampMine]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
        {isMine && (
          <Avatar
            uri={state?.user?.profilePicUrl}
            haloColor="blue"
            size={34}
            disableNavigation
            style={styles.messageAvatar}
          />
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!typingIndicator?.isTyping) return null;

    return (
      <View style={styles.typingRow}>
        <Avatar
          uri={typingIndicator.profilePicUrl || user.profilePicUrl}
          size={30}
          disableNavigation
        />
        <View style={[styles.typingBubble, styles.bubbleTheirs]}>
          <View style={styles.typingContent}>
            <View style={styles.typingDots}>
              {typingDots.map((value, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.typingDot,
                    {
                      opacity: value.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                      transform: [
                        {
                          translateY: value.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -3],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.typingText}>
              {typingIndicator.username || username} is typing...
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
          {loading && !sortedMessages.length ? (
            <ActivityIndicator size="small" color="#f59e0b" />
          ) : (
            <FlatList
              ref={listRef}
              data={sortedMessages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListFooterComponent={renderTypingIndicator}
              onContentSizeChange={() =>
                requestAnimationFrame(() =>
                  listRef.current?.scrollToEnd({ animated: true })
                )
              }
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    Start the accountability chat with {username}.
                  </Text>
                </View>
              )}
            />
          )}
        </View>
        <View style={styles.inputBar}>
          <Avatar
            uri={state?.user?.profilePicUrl}
            haloColor="blue"
            size={32}
            disableNavigation
            style={styles.inputAvatar}
          />

          <View style={styles.inputWrapper}>
            <TextInput
              value={messageText}
              onChangeText={handleTextChange}
              placeholder={`Message ${username}`}
              placeholderTextColor="#94a3b8"
              style={styles.input}
              multiline
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
            />

            <TouchableOpacity
              style={[
                styles.inlineSendButton,
                (!messageText.trim() || sending) &&
                  styles.inlineSendButtonDisabled,
              ]}
              disabled={!messageText.trim() || sending}
              onPress={handleSend}
              accessibilityLabel={`Send direct message to ${username}`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <Ionicons
                  name="send"
                  size={17}
                  color={messageText.trim() ? "#38bdf8" : "#64748b"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
  },
  listContent: {
    paddingBottom: 8,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    alignSelf: "flex-start",
  },
  bubbleStack: {
    flex: 1,
    alignItems: "flex-start",
  },
  bubbleStackMine: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "100%",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleMine: {
    backgroundColor: "rgba(56,189,248,0.14)",
    borderColor: "#38bdf8",
    borderTopRightRadius: 6,
    alignSelf: "flex-end",
  },
  bubbleTheirs: {
    backgroundColor: "rgba(245,158,11,0.08)",
    borderColor: "#f59e0b",
    borderTopLeftRadius: 6,
    alignSelf: "flex-start",
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
  },
  typingBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#f59e0b",
  },
  typingText: {
    color: "#fef3c7",
    fontSize: 12,
  },
  messageText: {
    fontSize: 15,
  },
  messageTextMine: {
    color: "#e0f2fe",
    fontWeight: "600",
  },
  messageTextTheirs: {
    color: "#fef3c7",
  },
  timestamp: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 6,
  },
  timestampMine: {
    color: "#bae6fd",
    opacity: 0.9,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  inputAvatar: {
    marginBottom: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: "#fef3c7",
    fontSize: 14,
    maxHeight: 100,
    paddingRight: 8,
  },
  inlineSendButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  inlineSendButtonDisabled: {
    opacity: 0.4,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 30,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
  },
});

export default DirectMessageScreen;
