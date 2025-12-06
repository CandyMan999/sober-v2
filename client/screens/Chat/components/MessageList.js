import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Avatar from "../../../components/Avatar";
import TypingIndicator from "../../../components/TypingIndicator";
import MessageBubble from "./MessageBubble";

const MessageList = ({
  messages,
  currentUserId,
  loading,
  onRefresh,
  lastMessageId,
  contentPaddingBottom = 0,
}) => {
  const listRef = useRef(null);
  const [distanceFromBottom, setDistanceFromBottom] = useState(0);
  const initialScrollDone = useRef(false);
  const lastMessageIdRef = useRef(undefined);
  const typingKeysRef = useRef([]);

  const autoScrollThreshold = useMemo(() => 420, []);
  const shouldAutoScroll = distanceFromBottom <= autoScrollThreshold;

  const renderItem = ({ item }) => {
    if (item?.__typingIndicator) {
      return (
        <View style={styles.typingRow}>
          <Avatar uri={item.profilePicUrl} size={30} disableNavigation />
          <TypingIndicator
            username={item.username || "Someone"}
            accentColor="#f59e0b"
            bubbleColor="rgba(11,18,32,0.95)"
            borderColor="rgba(148,163,184,0.35)"
            dotColor="#f59e0b"
          />
        </View>
      );
    }

    return (
      <MessageBubble
        message={item}
        isMine={
          String(item?.author?.id || item?.author?._id) === String(currentUserId)
        }
      />
    );
  };

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      InteractionManager.runAfterInteractions(() => {
        listRef.current?.scrollToEnd({ animated });
      });
    });
  };

  useEffect(() => {
    if (!lastMessageId || !messages?.length) return;

    const isFirstMessage = !initialScrollDone.current;
    const isNewMessage =
      !!lastMessageIdRef.current && lastMessageIdRef.current !== lastMessageId;

    if (isFirstMessage) {
      scrollToBottom(false);
      initialScrollDone.current = true;
    } else if (isNewMessage && shouldAutoScroll) {
      scrollToBottom(true);
    }

    lastMessageIdRef.current = lastMessageId;
  }, [lastMessageId, messages?.length, shouldAutoScroll]);

  useEffect(() => {
    const typingKeys = (messages || [])
      .filter((item) => item?.__typingIndicator)
      .map((item) => String(item?._id || item?.userId || item?.username));

    const hasChanged = typingKeys.join("|") !== typingKeysRef.current.join("|");
    typingKeysRef.current = typingKeys;

    if (!hasChanged) return;
    if (!shouldAutoScroll) return;

    scrollToBottom(true);
  }, [messages, shouldAutoScroll]);

  const handleScroll = (event) => {
    const {
      contentOffset: { y: offsetY },
      contentSize: { height: contentHeight },
      layoutMeasurement: { height: layoutHeight },
    } = event.nativeEvent;

    const distance = Math.max(contentHeight - layoutHeight - offsetY, 0);
    setDistanceFromBottom(distance);
  };

  const handleContentSizeChange = () => {
    if (!initialScrollDone.current && lastMessageId && messages?.length) {
      scrollToBottom(false);
      initialScrollDone.current = true;
      lastMessageIdRef.current = lastMessageId;
    }
  };

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) =>
        item?.__typingIndicator
          ? String(item?._id || item?.userId || item?.username)
          : String(item?.id || item?._id)
      }
      renderItem={renderItem}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: contentPaddingBottom, paddingTop: 0 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onContentSizeChange={handleContentSizeChange}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          tintColor="#f59e0b"
          colors={["#f59e0b"]}
          refreshing={loading}
          onRefresh={onRefresh}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          {loading ? (
            <ActivityIndicator size="small" color="#f59e0b" />
          ) : (
            <Text style={styles.emptyText}>
              Start the conversation and support others on their journey.
            </Text>
          )}
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 0,
    paddingBottom: 0,
    gap: 6,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
    paddingTop: 2,
  },
  emptyState: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
  },
});

export default MessageList;
