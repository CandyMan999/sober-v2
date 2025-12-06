import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RoomHeader from "./components/RoomHeader";
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
} from "../../GraphQL/chatRooms";

const sortByCreatedAt = (items = []) => {
  return [...items].sort((a, b) => {
    const aDate = new Date(a?.createdAt || 0).getTime();
    const bDate = new Date(b?.createdAt || 0).getTime();
    return aDate - bDate;
  });
};

const ChatRoomScreen = ({ route }) => {
  const { state } = useContext(Context);
  const client = useClient();
  const roomName = route?.params?.roomName || "General";
  const currentUser = state?.user;
  const currentUserId = currentUser?.id;

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
      setMessages(sortByCreatedAt(incoming));
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
        setMessages((prev) => sortByCreatedAt([...prev, newComment]));
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.container}>
          <RoomHeader name={roomName} />
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
            />
          )}
          <MessageInput
            value={messageText}
            onChangeText={setMessageText}
            onSend={handleSend}
            disabled={sending || !room?.id}
            currentUser={currentUser}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    backgroundColor: "#0b1220",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ChatRoomScreen;
