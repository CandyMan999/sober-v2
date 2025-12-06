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
import Context from "../../context";
import { useClient } from "../../client";
import {
  CHANGE_ROOM,
  CREATE_COMMENT,
  GET_COMMENTS,
  GET_ROOMS,
  ROOM_COMMENT_SUBSCRIPTION,
} from "../../GraphQL/chatRooms";
import {
  DIRECT_TYPING_SUBSCRIPTION,
  SET_DIRECT_TYPING,
} from "../../GraphQL/directMessages";
import { GRAPHQL_URI } from "../../config/endpoint";

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

const buildWsUrl = () => GRAPHQL_URI.replace(/^http/, "ws");

const ChatRoomScreen = ({ route }) => {
  const { state } = useContext(Context);
  const client = useClient();
  const roomName = route?.params?.roomName || "General";
  const currentUser = state?.user;
  const currentUserId = currentUser?.id;
  const isFocused = useIsFocused();

  const wsClientRef = useRef(null);
  const commentSubscriptionRef = useRef(null);
  const scrollToBottomRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  const ensureRoom = useCallback(async () => {
    if (!currentUserId) {
      setLoadingRoom(false);
      return;
    }
    setLoadingRoom(true);

    try {
      const roomListResponse = await client.request(GET_ROOMS);
      const rooms = roomListResponse?.getRooms || [];

      const targetRoom = rooms.find((candidate) => candidate.name === roomName);

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

  const applyMessages = useCallback((updater) => {
    setMessages((prev) => {
      const next = dedupeMessages(sortByCreatedAt(updater(prev)));
      return next;
    });
  }, []);

  const hydrateMessages = useCallback(
    async (isActive = () => true) => {
      if (!room?.id) return;

      setLoadingMessages(true);

      try {
        const response = await client.request(GET_COMMENTS, { roomId: room.id });
        const incoming = response?.getComments || [];

        if (isActive()) {
          applyMessages(() => incoming);
        }
      } catch (error) {
        console.log("Failed to load comments", error);
      } finally {
        if (isActive()) {
          setLoadingMessages(false);
        }
      }
    },
    [applyMessages, client, room?.id]
  );

  useFocusEffect(
    useCallback(() => {
      ensureRoom();
      return undefined;
    }, [ensureRoom])
  );

  useEffect(() => {
    if (!room?.id) return undefined;

    let isActive = true;
    hydrateMessages(() => isActive);

    return () => {
      isActive = false;
    };
  }, [hydrateMessages, room?.id]);

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
    if (loadingMessages) return undefined;

    const timer = setTimeout(() => {
      scrollToBottomRef.current?.(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [loadingMessages]);

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

        applyMessages((prev) => {
          const next = [...prev];
          const incomingId = getMessageId(incoming);
          const existingIndex = next.findIndex(
            (msg) => getMessageId(msg) === incomingId
          );

          if (existingIndex !== -1) {
            next[existingIndex] = { ...next[existingIndex], ...incoming };
            return next;
          }

          return [...next, incoming];
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
  }, [applyMessages, currentUserId, isFocused, room?.id, wsClientRef]);

  const handleSend = useCallback(async () => {
    if (!messageText?.trim() || !room?.id || !currentUserId) return;

    setSending(true);
    try {
      const response = await client.request(CREATE_COMMENT, {
        text: messageText.trim(),
        userId: currentUserId,
        roomId: room.id,
      });

      const newComment = response?.createComment;
      if (newComment) {
        applyMessages((prev) => [...prev, newComment]);
        setMessageText("");
      }
    } catch (error) {
      console.log("Failed to send comment", error);
    } finally {
      setSending(false);
    }
  }, [applyMessages, client, currentUserId, messageText, room?.id]);

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
    () => loadingRoom || !room?.id || (loadingMessages && !messages.length),
    [loadingMessages, loadingRoom, messages.length, room?.id]
  );

  const lastMessageId = useMemo(() => {
    const latest = messages?.[messages.length - 1];
    return getMessageId(latest) || getMessageId(room?.lastMessage) || undefined;
  }, [messages, room?.lastMessage]);

  const typingIndicators = useMemo(
    () => Object.values(typingUsers || {}).filter((typing) => typing?.isTyping),
    [typingUsers]
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
              key={roomName}
              messages={listData}
              currentUserId={currentUserId}
              loading={loadingMessages}
              onRefresh={hydrateMessages}
              lastMessageId={lastMessageId}
              contentPaddingBottom={0}
              doneLoading={!loadingMessages}
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
    paddingHorizontal: 0,
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
