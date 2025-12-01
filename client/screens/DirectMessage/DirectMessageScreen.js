// screens/Direct/DirectMessageScreen.js
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
  Animated,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  AppState,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
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
import { TOGGLE_LIKE_MUTATION } from "../../GraphQL/mutations";
import { useClient } from "../../client";
import { GRAPHQL_URI } from "../../config/endpoint";
import TypingIndicator from "../../components/TypingIndicator";
import { getToken } from "../../utils/helpers";

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

  // LOCAL typing (this user)
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  // REMOTE typing (other user)
  const [isTypingRemote, setIsTypingRemote] = useState(false);

  const listRef = useRef(null);
  const previousCount = useRef(0);
  const wsClientRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const likeScales = useRef({});
  const likeOpacities = useRef({});
  const tapTimestamps = useRef({});

  const syncMessagesFromRoom = useCallback(
    (roomData) => {
      if (!roomData?.comments) return;

      setMessages((prev) => {
        const incomingById = new Map(prev.map((msg) => [msg.id, msg]));
        roomData.comments.forEach((msg) => {
          const previous = incomingById.get(msg.id);
          const likesCount = msg?.likesCount ?? previous?.likesCount ?? 0;
          const liked =
            typeof msg?.liked === "boolean"
              ? msg.liked
              : typeof previous?.liked === "boolean"
              ? previous.liked
              : likesCount > 0;
          syncLikeVisualState(msg.id, liked);
          incomingById.set(msg.id, {
            ...previous,
            ...msg,
            likesCount,
            liked,
          });
        });

        return [...incomingById.values()].sort(
          (a, b) =>
            (parseDateValue(a.createdAt)?.getTime() || 0) -
            (parseDateValue(b.createdAt)?.getTime() || 0)
        );
      });
    },
    [syncLikeVisualState]
  );

  // 1) Load room + initial messages
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

  // 2) Manual WebSocket subscriptions (messages + typing)
  useEffect(() => {
    if (!roomId) return;

    const wsUrl = buildWsUrl();
    let wsClient;

    try {
      wsClient = new SubscriptionClient(wsUrl, {
        reconnect: true,
      });
      wsClientRef.current = wsClient;
    } catch (err) {
      console.error("[DM] Failed to init WS client", err);
      return undefined;
    }

    // --- message subscription ---
    const messageObservable = wsClient.request({
      query: DIRECT_MESSAGE_SUBSCRIPTION,
      variables: { roomId },
    });

    const messageSubscription = messageObservable.subscribe({
      next: ({ data }) => {
        try {
          const incoming = data?.directMessageReceived;

          if (!incoming) return;

          setMessages((prev) => {
            const incomingLiked =
              (incoming?.liked ?? false) || (incoming?.likesCount || 0) > 0;

            const existingIndex = prev.findIndex((msg) => msg.id === incoming.id);

            if (existingIndex !== -1) {
              const existing = prev[existingIndex];
              const nextLiked = incomingLiked;
              const nextLikesCount = incoming?.likesCount ?? existing.likesCount ?? 0;

              const updated = {
                ...existing,
                ...incoming,
                liked: nextLiked,
                likesCount: nextLikesCount,
              };

              if (!existing.liked && nextLiked) runLikeAnimation(incoming.id, true);
              if (existing.liked && !nextLiked) runLikeAnimation(incoming.id, false);
              syncLikeVisualState(incoming.id, nextLiked);

              const nextList = [...prev];
              nextList[existingIndex] = updated;
              return nextList.sort(
                (a, b) =>
                  (parseDateValue(a.createdAt)?.getTime() || 0) -
                  (parseDateValue(b.createdAt)?.getTime() || 0)
              );
            }

            if (incomingLiked) {
              runLikeAnimation(incoming.id, true);
            }

            syncLikeVisualState(incoming.id, incomingLiked);

            return [
              ...prev,
              {
                ...incoming,
                liked: incomingLiked,
                likesCount: incoming?.likesCount ?? 0,
              },
            ].sort(
              (a, b) =>
                (parseDateValue(a.createdAt)?.getTime() || 0) -
                (parseDateValue(b.createdAt)?.getTime() || 0)
            );
          });
        } catch (err) {
          console.error("[DM] WS message handler failed:", err);
        }
      },
      error: (err) => {
        console.error("[DM] WS message subscription error:", err);
      },
      complete: () => {
        console.log("[DM] WS message subscription completed");
      },
    });

    // --- typing subscription ---
    const typingObservable = wsClient.request({
      query: DIRECT_TYPING_SUBSCRIPTION,
      variables: { roomId },
    });

    const typingSubscription = typingObservable.subscribe({
      next: ({ data }) => {
        try {
          const typing = data?.directTyping;
          if (!typing) return;

          // do NOT show indicator for our own typing events
          if (String(typing.userId) === String(currentUserId)) return;

          const incomingIsTyping = !!typing.isTyping;
          setIsTypingRemote(incomingIsTyping);
        } catch (err) {
          console.error("[DM] Typing subscription handler failed:", err);
        }
      },
      error: (err) => {
        console.error("[DM] Typing subscription error:", err);
      },
    });

    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
      wsClientRef.current?.close?.(false);
      wsClientRef.current = null;
      setIsTypingRemote(false);
    };
  }, [currentUserId, roomId]);

  // 3) Sorted messages + auto-scroll
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

  // 4) Derive LOCAL typing from messageText
  useEffect(() => {
    const next = messageText.trim().length > 0;
    setIsTypingLocal(next);
  }, [messageText]);

  // 5) Whenever local typing changes, send it to backend
  useEffect(() => {
    if (!roomId) return;

    const send = async () => {
      try {
        await client.request(SET_DIRECT_TYPING, {
          roomId,
          isTyping: isTypingLocal,
        });
      } catch (err) {
        console.error("[DM] Failed to publish typing state", err);
      }
    };

    send();
  }, [client, roomId, isTypingLocal]);

  // 6) App goes background → clear local typing & text (will send false)
  useEffect(() => {
    const handleAppStateChange = (nextState) => {
      if (nextState.match(/inactive|background/i)) {
        appState.current = nextState;
        setMessageText("");
        setIsTypingLocal(false);
      } else {
        appState.current = nextState;
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // 7) When navigating away, clear typing & text (will send false)
  useFocusEffect(
    useCallback(() => {
      return () => {
        setMessageText("");
        setIsTypingLocal(false);
        setIsTypingRemote(false);
      };
    }, [])
  );

  // 8) Input change
  const handleTextChange = useCallback((value) => {
    setMessageText(value);
  }, []);

  // 9) Send message
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
          return [
            ...prev,
            {
              ...newMessage,
              liked: newMessage?.liked ?? (newMessage?.likesCount || 0) > 0,
              likesCount: newMessage?.likesCount ?? 0,
            },
          ].sort(
            (a, b) =>
              (parseDateValue(a.createdAt)?.getTime() || 0) -
              (parseDateValue(b.createdAt)?.getTime() || 0)
          );
        });
      }

      // clear input; local typing effect will send isTyping=false
      setMessageText("");
    } catch (err) {
      console.error("Failed to send direct message", err);
    } finally {
      setSending(false);
    }
  }, [client, currentUserId, messageText, targetUserId]);

  // 10) Renderers
  const ensureAnimValue = (store, key, initialValue) => {
    if (!store.current[key]) {
      store.current[key] = new Animated.Value(initialValue);
    }
    return store.current[key];
  };

  const getLikeScale = (messageId) => ensureAnimValue(likeScales, messageId, 0);
  const getLikeOpacity = (messageId) => ensureAnimValue(likeOpacities, messageId, 0);

  const syncLikeVisualState = useCallback((messageId, liked) => {
    const scale = getLikeScale(messageId);
    const opacity = getLikeOpacity(messageId);

    scale.setValue(liked ? 1 : 0);
    opacity.setValue(liked ? 1 : 0);
  }, []);

  const runLikeAnimation = useCallback((messageId, activating) => {
    const scale = getLikeScale(messageId);
    const opacity = getLikeOpacity(messageId);

    if (activating) {
      scale.setValue(0.4);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 80,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  const toggleMessageLike = useCallback(
    async (messageId) => {
      const message = messages.find((msg) => msg.id === messageId);
      if (!message) return;

      const isMine = String(message.author?.id) === String(currentUserId);
      if (isMine) return;

      let previousLiked = false;
      let previousLikesCount = 0;

      setMessages((prev) =>
        prev.map((current) => {
          if (current.id !== messageId) return current;
          previousLiked = current.liked;
          previousLikesCount = current.likesCount || 0;
          const nextLiked = !current.liked;
          const likesCount = Math.max(
            0,
            (current.likesCount || 0) + (nextLiked ? 1 : -1)
          );

          runLikeAnimation(messageId, nextLiked);

          return { ...current, liked: nextLiked, likesCount };
        })
      );

      try {
        const token = await getToken();
        const response = await client.request(TOGGLE_LIKE_MUTATION, {
          token,
          targetType: "COMMENT",
          targetId: messageId,
        });

        const payload = response?.toggleLike;
        if (payload) {
          setMessages((prev) =>
            prev.map((message) => {
              if (message.id !== messageId) return message;

              const nextLiked = payload.likesCount > 0;
              const likesCount = payload.likesCount ?? message.likesCount ?? 0;

              if (!message.liked && nextLiked) {
                runLikeAnimation(messageId, true);
              }
              if (message.liked && !nextLiked) {
                runLikeAnimation(messageId, false);
              }

              syncLikeVisualState(messageId, nextLiked);

              return { ...message, liked: nextLiked, likesCount };
            })
          );
        }
      } catch (err) {
        console.error("Failed to toggle message like", err);
        setMessages((prev) =>
          prev.map((message) => {
            if (message.id !== messageId) return message;
            // revert optimistic toggle
            syncLikeVisualState(messageId, previousLiked);
            return {
              ...message,
              liked: previousLiked,
              likesCount: previousLikesCount,
            };
          })
        );
      }
    },
    [client, currentUserId, messages, runLikeAnimation, syncLikeVisualState]
  );

  const handleBubblePress = useCallback(
    (messageId, authorId) => {
      if (String(authorId) === String(currentUserId)) return;

      const now = Date.now();
      const lastTap = tapTimestamps.current[messageId] || 0;

      tapTimestamps.current[messageId] = now;
      if (now - lastTap < 280) {
        toggleMessageLike(messageId);
      }
    },
    [currentUserId, toggleMessageLike]
  );

  const renderMessage = ({ item }) => {
    const isMine = String(item.author?.id) === String(currentUserId);
    const likeScale = getLikeScale(item.id);
    const likeOpacity = getLikeOpacity(item.id);

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
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleBubblePress(item.id, item.author?.id)}
          >
            <View
              style={[
                styles.bubble,
                isMine ? styles.bubbleMine : styles.bubbleTheirs,
              ]}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.likeBadge,
                  isMine ? styles.likeBadgeMine : styles.likeBadgeTheirs,
                  {
                    opacity: likeOpacity,
                    transform: [{ scale: likeScale }],
                  },
                ]}
              >
                <Text style={styles.likeBadgeText}>👍</Text>
              </Animated.View>
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
          </TouchableOpacity>
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
    if (!isTypingRemote) return null;

    return (
      <View style={styles.typingRow}>
        <Avatar uri={user.profilePicUrl} size={30} disableNavigation />
        <TypingIndicator
          username={user.username}
          accentColor="#f59e0b"
          bubbleColor="rgba(11,18,32,0.95)"
          borderColor="rgba(148,163,184,0.35)"
          dotColor="#f59e0b"
        />
      </View>
    );
  };

  // 11) JSX
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
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#f59e0b" />
            </View>
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
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
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
    borderRadius: 17,
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
    paddingTop: 4,
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
  likeBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  likeBadgeMine: {
    left: -6,
  },
  likeBadgeTheirs: {
    right: -12,
  },
  likeBadgeText: {
    fontSize: 14,
  },
});

export default DirectMessageScreen;
