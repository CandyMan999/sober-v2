import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SubscriptionClient } from "subscriptions-transport-ws";

import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
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
import { GRAPHQL_URI } from "../../config/endpoint";

const sortByCreatedAt = (items = []) => {
  return [...items].sort((a, b) => {
    const aDate = new Date(a?.createdAt || 0).getTime();
    const bDate = new Date(b?.createdAt || 0).getTime();
    return aDate - bDate;
  });
};

const getMessageId = (message = {}) =>
  String(message.id || message._id || "");

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
  const insets = useSafeAreaInsets();

  const wsClientRef = useRef(null);
  const commentSubscriptionRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

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

    setLoadingMessages(true);
    try {
      const response = await client.request(GET_COMMENTS, { roomId: room.id });
      const incoming = response?.getComments || [];
      const normalized = dedupeMessages(sortByCreatedAt(incoming));
      setMessages(normalized);
    } catch (error) {
      console.log("Failed to load comments", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [client, room?.id]);

  useEffect(() => {
    ensureRoom();
  }, [ensureRoom]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!room?.id) return undefined;

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

    const subscription = commentObservable.subscribe({
      next: ({ data }) => {
        const incoming = data?.roomCommentCreated;
        if (!incoming) return;

        setMessages((prev) => {
          const next = [...prev];
          const incomingId = getMessageId(incoming);
          const existingIndex = next.findIndex(
            (msg) => getMessageId(msg) === incomingId
          );

          if (existingIndex !== -1) {
            next[existingIndex] = { ...next[existingIndex], ...incoming };
            return sortByCreatedAt(next);
          }

          return dedupeMessages(sortByCreatedAt([...next, incoming]));
        });
      },
      error: (error) => {
        console.log("Room comment subscription error", error);
      },
    });

    commentSubscriptionRef.current = subscription;

    return () => {
      subscription?.unsubscribe?.();
      commentSubscriptionRef.current = null;
      wsClient?.close?.();
      wsClientRef.current = null;
    };
  }, [room?.id, wsClientRef]);

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
        setMessages((prev) =>
          dedupeMessages(sortByCreatedAt([...prev, newComment]))
        );
        setMessageText("");
      }
    } catch (error) {
      console.log("Failed to send comment", error);
    } finally {
      setSending(false);
    }
  }, [client, currentUserId, messageText, room?.id]);

  const isLoading = useMemo(
    () => loadingRoom || (loadingMessages && !messages.length),
    [loadingRoom, loadingMessages, messages.length]
  );

  const keyboardVerticalOffset =
    Platform.OS === "ios" ? insets.bottom + 72 : 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <SafeAreaView
        style={styles.safeArea}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.container}>
          <View style={styles.messageArea}>
            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#f59e0b" />
              </View>
            ) : (
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
                loading={loadingMessages}
                onRefresh={loadMessages}
                contentPaddingBottom={Math.max(insets.bottom + 8, 12)}
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
              bottomInset={insets.bottom}
            />
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050816",
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  messageArea: {
    flex: 1,
    backgroundColor: "#0b1220",
    paddingHorizontal: 16,
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
