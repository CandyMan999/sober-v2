import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MessageBubble from "./MessageBubble";

const AUTO_SCROLL_THRESHOLD_PX = 420; // how far from bottom we still auto-scroll

const MessageList = ({
  messages,
  currentUserId,
  loading,
  onRefresh,
  lastMessageId,
  contentPaddingBottom = 0,
}) => {
  const listRef = useRef(null);

  // How far the user is from the bottom
  const [distanceFromBottom, setDistanceFromBottom] = useState(0);

  // Track first “anchor” scroll
  const initialScrollDone = useRef(false);

  // Track last message we reacted to
  const lastMessageIdRef = useRef(undefined);

  // Track previous message count (like DirectMessageScreen)
  const previousCountRef = useRef(0);

  // Fast flag to know if we’re near the bottom
  const isNearBottomRef = useRef(true);

  const renderItem = ({ item }) => (
    <MessageBubble
      message={item}
      isMine={
        String(item?.author?.id || item?.author?._id) === String(currentUserId)
      }
    />
  );

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      InteractionManager.runAfterInteractions(() => {
        listRef.current?.scrollToEnd({ animated });
      });
    });
  }, []);

  // 🔥 Core auto-scroll logic: “new message + near bottom → scroll”
  useEffect(() => {
    if (!messages?.length) return;

    const prevCount = previousCountRef.current;
    const hasNewMessage = messages.length > prevCount;
    previousCountRef.current = messages.length;

    // First time we load messages → hard jump to bottom
    if (!initialScrollDone.current) {
      scrollToBottom(false);
      initialScrollDone.current = true;
      lastMessageIdRef.current = lastMessageId;
      return;
    }

    // For subsequent updates: only auto-scroll if:
    // 1) There is a new message
    // 2) We’re close enough to the bottom (user not reading history)
    if (hasNewMessage && isNearBottomRef.current) {
      scrollToBottom(true);
    }

    lastMessageIdRef.current = lastMessageId;
  }, [messages.length, lastMessageId, scrollToBottom]);

  const handleScroll = (event) => {
    const {
      contentOffset: { y: offsetY },
      contentSize: { height: contentHeight },
      layoutMeasurement: { height: layoutHeight },
    } = event.nativeEvent;

    const distance = Math.max(contentHeight - layoutHeight - offsetY, 0);
    setDistanceFromBottom(distance);
    isNearBottomRef.current = distance <= AUTO_SCROLL_THRESHOLD_PX;
  };

  // Make sure initial render (or heavy reload) anchors at bottom
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
      keyExtractor={(item) => String(item?.id || item?._id)}
      renderItem={renderItem}
      contentContainerStyle={[
        styles.listContent,
        {
          // small bottom pad helps avoid “one bubble off” feeling,
          // and keeps it symmetric with your DM screen
          paddingBottom: 16 + contentPaddingBottom,
          paddingTop: 0,
        },
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
