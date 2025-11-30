import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApolloClient } from "@apollo/client";

import Avatar from "../../components/Avatar";
import Context from "../../context";
import {
  DIRECT_MESSAGE_SUBSCRIPTION,
  DIRECT_ROOM_WITH_USER,
  SEND_DIRECT_MESSAGE,
} from "../../GraphQL/directMessages";
import { useClient } from "../../client";

const formatTime = (timestamp) => {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const DirectMessageScreen = ({ route, navigation }) => {
  const { state } = useContext(Context);
  const apolloClient = useApolloClient();
  const client = useClient();
  const currentUserId = state?.user?.id;
  const user = route?.params?.user || {};
  const targetUserId = user?.id;
  const username = user.username || "Buddy";

  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [sendError, setSendError] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [loading, setLoading] = useState(false);

  const syncMessagesFromRoom = useCallback((roomData) => {
    if (!roomData?.comments) return;

    setMessages((prev) => {
      const incomingById = new Map(prev.map((msg) => [msg.id, msg]));
      roomData.comments.forEach((msg) => {
        incomingById.set(msg.id, msg);
      });

      return [...incomingById.values()].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    });
  }, []);

  useEffect(() => {
    if (!targetUserId || !currentUserId) return;

    let isMounted = true;
    setLoading(true);

    client
      .request(DIRECT_ROOM_WITH_USER, { userId: targetUserId })
      .then((result) => {
        if (!isMounted) return;
        const room = result?.directRoomWithUser;
        if (room?.id) {
          setRoomId(room.id);
        }
        syncMessagesFromRoom(room);
      })
      .catch((error) => {
        if (!isMounted) return;
        setSendError(error?.message || "Unable to load messages right now.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [client, currentUserId, syncMessagesFromRoom, targetUserId]);

  useEffect(() => {
    if (!apolloClient || !roomId || !currentUserId) return undefined;

    const subscription = apolloClient
      .subscribe({
        query: DIRECT_MESSAGE_SUBSCRIPTION,
        variables: { roomId },
      })
      .subscribe({
        next: ({ data: subscriptionData }) => {
          const incoming = subscriptionData?.directMessageReceived;
          if (!incoming) return;

          setMessages((prev) => {
            if (prev.find((msg) => msg.id === incoming.id)) return prev;
            return [...prev, incoming].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          });
        },
        error: (err) => {
          console.log("Direct message subscription error", err);
        },
      });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [apolloClient, currentUserId, roomId]);

  const [sending, setSending] = useState(false);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      ),
    [messages]
  );

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || !targetUserId || !currentUserId) return;

    setSendError("");

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
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        });
      }

      setMessageText("");
    } catch (err) {
      setSendError(err?.message || "Unable to send message right now.");
    } finally {
      setSending(false);
    }
  }, [client, currentUserId, messageText, targetUserId]);

  const renderMessage = ({ item }) => {
    const isMine = String(item.author?.id) === String(currentUserId);

    return (
      <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
        {!isMine && (
          <Avatar
            uri={item.author?.profilePicUrl}
            size={34}
            disableNavigation
          />
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
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
    );
  };

  return (
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

      {sendError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{sendError}</Text>
        </View>
      ) : null}

      <View style={styles.body}>
        {loading && !sortedMessages.length ? (
          <ActivityIndicator size="small" color="#f59e0b" />
        ) : (
          <FlatList
            data={sortedMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder={`Message ${username}`}
          placeholderTextColor="#6b7280"
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
          disabled={!messageText.trim() || sending}
          onPress={handleSend}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#0b1220" />
          ) : (
            <Ionicons name="send" size={18} color="#0b1220" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  errorBanner: {
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomColor: "rgba(248, 113, 113, 0.35)",
    borderBottomWidth: 1,
  },
  errorText: {
    color: "#fecdd3",
    fontSize: 12,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  listContent: {
    paddingBottom: 12,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: "#f59e0b",
    borderTopRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: "#0b1220",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  messageText: {
    fontSize: 15,
  },
  messageTextMine: {
    color: "#0b1220",
    fontWeight: "600",
  },
  messageTextTheirs: {
    color: "#e5e7eb",
  },
  timestamp: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 6,
  },
  timestampMine: {
    color: "#0b1220",
    opacity: 0.75,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  input: {
    flex: 1,
    color: "#f9fafb",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f59e0b",
  },
  sendButtonDisabled: {
    backgroundColor: "#9ca3af",
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
