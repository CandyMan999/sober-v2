import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, AppState, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";

import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import { MESSAGE_STYLE_PRESETS } from "./components/messageStyles";
import Context from "../../context";
import { useClient } from "../../client";
import {
  CHANGE_ROOM,
  CREATE_COMMENT,
  CREATE_ROOM,
  GET_COMMENTS,
  GET_ROOMS,
  ROOM_COMMENT_SUBSCRIPTION,
} from "../../GraphQL/chatRooms";
import {
  DIRECT_TYPING_SUBSCRIPTION,
  SET_DIRECT_TYPING,
} from "../../GraphQL/directMessages";
import { TOGGLE_LIKE_MUTATION } from "../../GraphQL/mutations";
import { GRAPHQL_URI } from "../../config/endpoint";
import { getToken } from "../../utils/helpers";

const sortByCreatedAt = (items = []) => {
  return [...items].sort((a, b) => {
    const aDate = new Date(a?.createdAt || 0).getTime();
    const bDate = new Date(b?.createdAt || 0).getTime();
    return aDate - bDate;
  });
};

const getMessageId = (message = {}) => String(message.id || message._id || "");

const dedupeMessages = (items = []) => {
  const seen = new Set();
  const unique = [];

  items.forEach((item) => {
    const id = getMessageId(item);
    if (!id || seen.has(id)) return;
    seen.add(id);
    unique.push(item);
  });

  return unique;
};

const normalizeMessage = (incoming = {}, previous = {}, currentUserId) => {
  const likesCount = incoming?.likesCount ?? previous?.likesCount ?? 0;
  const likes = Array.isArray(incoming?.likes)
    ? incoming.likes
    : previous?.likes;

  const payloadLiked =
    typeof incoming?.liked === "boolean"
      ? incoming.liked
      : typeof previous?.liked === "boolean"
      ? previous.liked
      : undefined;

  const likedFromLikes = Array.isArray(likes) && currentUserId
    ? likes.some((like) => {
        const userId = like?.user?.id || like?.user?._id;
        return userId && String(userId) === String(currentUserId);
      })
    : undefined;

  const liked =
    typeof payloadLiked === "boolean"
      ? payloadLiked
      : typeof likedFromLikes === "boolean"
      ? likedFromLikes
      : false;

  return {
    ...previous,
    ...incoming,
    likesCount,
    likes,
    liked,
  };
};

const buildWsUrl = () => GRAPHQL_URI.replace(/^http/, "ws");

const resolveMessageMatchId = (message = {}) => {
  const id = getMessageId(message);
  const targetId = message?.targetId ? String(message.targetId) : "";
  return id || targetId || "";
};

const STYLE_PRESET_COUNT = MESSAGE_STYLE_PRESETS.length;

const hashStyleIndex = (input) => {
  if (!input) return 0;

  const value = String(input);
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash + value.charCodeAt(i) * (i + 1)) % 2147483647;
  }

  return hash % STYLE_PRESET_COUNT;
};

const ChatRoomScreen = ({ route }) => {
  const { state } = useContext(Context);
  const client = useClient();
  const roomName = route?.params?.roomName || "General";
  const currentUser = state?.user;
  const currentUserId = currentUser?.id;
  const isFocused = useIsFocused();

  const normalizeForUser = useCallback(
    (incoming = {}, previous = {}) =>
      normalizeMessage(incoming, previous, currentUserId),
    [currentUserId]
  );

  const wsClientRef = useRef(null);
  const commentSubscriptionRef = useRef(null);
  const scrollToBottomRef = useRef(null);
  const inputRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const tapTimestampsRef = useRef({});

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [doneLoading, setDoneLoading] = useState(false);
  const [userStyleMap, setUserStyleMap] = useState({});

  const resolveUserStyle = useCallback(
    (author = {}) => {
      const authorId = author?.id || author?._id || author?.userId || author?.username;
      if (!authorId || String(authorId) === String(currentUserId)) return undefined;

      if (typeof author?.messageStyle === "number") {
        return author.messageStyle % STYLE_PRESET_COUNT;
      }

      if (typeof userStyleMap[authorId] === "number") {
        return userStyleMap[authorId];
      }

      return hashStyleIndex(authorId);
    },
    [currentUserId, userStyleMap]
  );

  const assignStylesToMessages = useCallback(
    (items = []) => {
      let didChange = false;
      const nextMap = { ...userStyleMap };

      const styledMessages = items.map((message) => {
        const author = message?.author || {};
        const authorId = author?.id || author?._id;

        if (!authorId || String(authorId) === String(currentUserId)) {
          return message;
        }

        let styleIndex;

        if (typeof author?.messageStyle === "number") {
          styleIndex = author.messageStyle % STYLE_PRESET_COUNT;
        } else if (typeof nextMap[authorId] === "number") {
          styleIndex = nextMap[authorId];
        } else {
          styleIndex = hashStyleIndex(authorId);
          nextMap[authorId] = styleIndex;
          didChange = true;
        }

        return {
          ...message,
          author: { ...author, messageStyle: styleIndex },
        };
      });

      if (didChange) {
        setUserStyleMap(nextMap);
      }

      return styledMessages;
    },
    [currentUserId, userStyleMap]
  );

  const ensureRoom = useCallback(async () => {
    if (!currentUserId) return;
    setLoadingRoom(true);

    try {
      const roomListResponse = await client.request(GET_ROOMS);
      const rooms = roomListResponse?.getRooms || [];

      let targetRoom = rooms.find((candidate) => candidate.name === roomName);

      if (!targetRoom) {
        const created = await client.request(CREATE_ROOM, { name: roomName });
        targetRoom = created?.createRoom;
      }

      if (targetRoom?.id) {
        const result = await client.request(CHANGE_ROOM, {
          roomId: targetRoom.id,
          userId: currentUserId,
        });

        setRoom(result?.changeRoom || targetRoom);
      }
    } catch (error) {
      console.log("Failed to ensure room", error);
    } finally {
      setLoadingRoom(false);
    }
  }, [client, currentUserId, roomName]);

  const loadMessages = useCallback(async () => {
    if (!room?.id) return;

    setDoneLoading(false);
    setLoadingMessages(true);
    try {
      const response = await client.request(GET_COMMENTS, { roomId: room.id });
      const incoming = response?.getComments || [];
      const normalized = dedupeMessages(sortByCreatedAt(incoming)).map((msg) =>
        normalizeForUser(msg)
      );
      setMessages(assignStylesToMessages(normalized));
    } catch (error) {
      console.log("Failed to load comments", error);
    } finally {
      setLoadingMessages(false);
      setDoneLoading(true);
    }
  }, [assignStylesToMessages, client, normalizeForUser, room?.id]);

  useFocusEffect(
    useCallback(() => {
      ensureRoom();
      return undefined;
    }, [ensureRoom])
  );

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

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

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!doneLoading) return;

    const timer = setTimeout(() => {
      scrollToBottomRef.current?.(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [doneLoading]);

  useEffect(() => {
    if (!room?.id || !isFocused) return undefined;

    const wsUrl = buildWsUrl();
    let wsClient;

    try {
      wsClient = new SubscriptionClient(wsUrl, { reconnect: true });
      wsClientRef.current = wsClient;
    } catch (error) {
      console.log("Room subscription init failed", error);
      return undefined;
    }

    const commentObservable = wsClient.request({
      query: ROOM_COMMENT_SUBSCRIPTION,
      variables: { roomId: room.id },
    });

    const typingObservable = wsClient.request({
      query: DIRECT_TYPING_SUBSCRIPTION,
      variables: { roomId: room.id },
    });

    const subscription = commentObservable.subscribe({
      next: ({ data }) => {
        const incoming = data?.roomCommentCreated;
        if (!incoming) return;

        setMessages((prev) => {
          const next = [...prev];
          const incomingMatchId = resolveMessageMatchId(incoming);
          const existingIndex = next.findIndex((msg) => {
            const msgId = getMessageId(msg);
            return msgId && msgId === incomingMatchId;
          });

          if (existingIndex !== -1) {
            next[existingIndex] = normalizeForUser(
              incoming,
              next[existingIndex]
            );
            return assignStylesToMessages(sortByCreatedAt(next));
          }

          const normalizedIncoming = normalizeForUser({
            ...incoming,
            id: incomingMatchId || incoming.id,
          });
          return assignStylesToMessages(
            dedupeMessages(sortByCreatedAt([...next, normalizedIncoming]))
          );
        });
      },
      error: (error) => {
        console.log("Room comment subscription error", error);
      },
    });

    const typingSubscription = typingObservable.subscribe({
      next: ({ data }) => {
        try {
          const typing = data?.directTyping;
          if (!typing) return;

          if (String(typing.userId) === String(currentUserId)) return;

          setTypingUsers((prev) => {
            const next = { ...prev };
            const key = String(typing.userId);

            if (typing.isTyping) {
              next[key] = typing;
            } else {
              delete next[key];
            }

            return next;
          });
        } catch (err) {
          console.error("Room typing subscription handler failed:", err);
        }
      },
      error: (err) => {
        console.error("Room typing subscription error:", err);
      },
    });

    commentSubscriptionRef.current = subscription;

    return () => {
      subscription?.unsubscribe?.();
      typingSubscription?.unsubscribe?.();
      commentSubscriptionRef.current = null;
      wsClient?.close?.();
      wsClientRef.current = null;
      setTypingUsers({});
    };
  }, [assignStylesToMessages, currentUserId, isFocused, normalizeForUser, room?.id, wsClientRef]);

  const handleSend = useCallback(async () => {
    if (!messageText?.trim() || !room?.id || !currentUserId) return;

    setSending(true);
    try {
      const response = await client.request(CREATE_COMMENT, {
        text: messageText.trim(),
        userId: currentUserId,
        roomId: room.id,
        replyToCommentId: replyTarget?.id || replyTarget?._id,
      });

      const newComment = normalizeForUser(response?.createComment);
      if (newComment) {
        setMessages((prev) =>
          assignStylesToMessages(
            dedupeMessages(sortByCreatedAt([...prev, newComment]))
          )
        );
        setMessageText("");
        setReplyTarget(null);
      }
    } catch (error) {
      console.log("Failed to send comment", error);
    } finally {
      setSending(false);
    }
  }, [assignStylesToMessages, client, currentUserId, messageText, replyTarget?._id, replyTarget?.id, room?.id]);

  const handleSelectReply = useCallback((target) => {
    if (!target) return;

    setReplyTarget(target);
    const mention = target?.author?.username
      ? `@${target.author.username} `
      : "";

    if (mention) {
      setMessageText((prev) => {
        if (prev.startsWith(mention)) return prev;
        return `${mention}${prev.trim() ? prev.trim() + " " : ""}`;
      });
    }

    requestAnimationFrame(() => inputRef.current?.focus?.());
  }, []);

  const handleCancelReply = useCallback(() => {
    if (replyTarget?.author?.username) {
      const mention = `@${replyTarget.author.username} `;
      setMessageText((prev) =>
        prev.startsWith(mention) ? prev.slice(mention.length) : prev
      );
    }
    setReplyTarget(null);
  }, [replyTarget]);

  const toggleMessageLike = useCallback(
    async (messageId) => {
      if (!messageId || !currentUserId) return;

      const target = messages.find(
        (msg) => getMessageId(msg) === String(messageId)
      );

      if (!target) return;

      const authorId = target?.author?.id || target?.author?._id;
      if (String(authorId) === String(currentUserId)) return;

      const previousLiked = !!target.liked;
      const previousLikesCount = target.likesCount || 0;
      const nextLiked = !previousLiked;
      const nextLikesCount = Math.max(
        0,
        previousLikesCount + (nextLiked ? 1 : -1)
      );

      setMessages((prev) =>
        prev.map((msg) => {
          if (getMessageId(msg) !== String(messageId)) return msg;
          return { ...msg, liked: nextLiked, likesCount: nextLikesCount };
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
          const payloadLiked =
            typeof payload.liked === "boolean"
              ? payload.liked
              : (payload.likesCount || 0) > 0;

          setMessages((prev) =>
            prev.map((msg) => {
              if (getMessageId(msg) !== String(payload.targetId || messageId))
                return msg;

              return normalizeForUser(
                {
                  ...msg,
                  likesCount: payload.likesCount ?? msg.likesCount ?? 0,
                  liked: payloadLiked,
                  likes: payload.like
                    ? payloadLiked
                      ? [...(msg.likes || []), payload.like]
                      : (msg.likes || []).filter(
                          (like) => getMessageId(like) !== getMessageId(payload.like)
                        )
                    : msg.likes,
                },
                msg
              );
            })
          );
        }
      } catch (err) {
        console.log("Failed to toggle comment like", err);
        setMessages((prev) =>
          prev.map((msg) => {
            if (getMessageId(msg) !== String(messageId)) return msg;
            return { ...msg, liked: previousLiked, likesCount: previousLikesCount };
          })
        );
      }
    },
    [client, currentUserId, messages, normalizeForUser]
  );

  const handleMessagePress = useCallback(
    (message) => {
      const messageId = getMessageId(message);
      if (!messageId) return;

      const authorId = message?.author?.id || message?.author?._id;
      if (String(authorId) === String(currentUserId)) return;

      const now = Date.now();
      const lastTap = tapTimestampsRef.current[messageId] || 0;

      tapTimestampsRef.current[messageId] = now;
      if (now - lastTap < 280) {
        toggleMessageLike(messageId);
      }
    },
    [currentUserId, toggleMessageLike]
  );

  useEffect(() => {
    const next = messageText.trim().length > 0;
    setIsTypingLocal(next);
  }, [messageText]);

  useEffect(() => {
    if (!room?.id) return;

    const send = async () => {
      try {
        await client.request(SET_DIRECT_TYPING, {
          roomId: room.id,
          isTyping: isTypingLocal,
        });
      } catch (err) {
        console.error("Failed to publish typing state", err);
      }
    };

    send();
  }, [client, isTypingLocal, room?.id]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setMessageText("");
        setIsTypingLocal(false);
        setTypingUsers({});
      };
    }, [])
  );

  const isLoading = useMemo(
    () => loadingRoom || (loadingMessages && !messages.length),
    [loadingRoom, loadingMessages, messages.length]
  );

  const lastMessageId = useMemo(() => {
    const latest = messages?.[messages.length - 1];
    return getMessageId(latest) || getMessageId(room?.lastMessage) || undefined;
  }, [messages, room?.lastMessage]);

  const typingIndicators = useMemo(
    () =>
      Object.values(typingUsers || {})
        .filter((typing) => typing?.isTyping)
        .map((typing) => ({
          ...typing,
          messageStyle:
            resolveUserStyle(typing) || hashStyleIndex(typing.userId || typing.username),
        })),
    [resolveUserStyle, typingUsers]
  );

  const listData = useMemo(
    () => [
      ...messages,
      ...typingIndicators.map((typing) => ({
        ...typing,
        __typingIndicator: true,
        _id: `typing-${typing.userId || typing.username || Math.random()}`,
      })),
    ],
    [messages, typingIndicators]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.container}>
        <View style={styles.messageArea}>
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#f59e0b" />
            </View>
          ) : (
            <MessageList
              key={room?.id || roomName}
              messages={listData}
              currentUserId={currentUserId}
              loading={loadingMessages}
              onRefresh={loadMessages}
              lastMessageId={lastMessageId}
              contentPaddingBottom={0}
              doneLoading={doneLoading}
              onReply={handleSelectReply}
              currentUsername={currentUser?.username}
              onPressMessage={handleMessagePress}
            />
          )}
        </View>

        <View style={styles.inputArea}>
          <MessageInput
            value={messageText}
            onChangeText={setMessageText}
            onSend={handleSend}
            disabled={sending || !room?.id}
            currentUser={currentUser}
            bottomInset={0}
            replyTarget={replyTarget}
            onCancelReply={handleCancelReply}
            ref={inputRef}
            participants={room?.users || []}
          />
        </View>
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
  },
  messageArea: {
    flex: 1,
    backgroundColor: "#0b1220",
    paddingHorizontal: 6,
    paddingTop: 0,
  },
  inputArea: {
    backgroundColor: "#0b1220",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ChatRoomScreen;
