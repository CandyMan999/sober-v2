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

  const autoScrollThreshold = useMemo(() => 420, []);
  const shouldAutoScroll = distanceFromBottom <= autoScrollThreshold;

  const renderItem = ({ item }) => (
    <MessageBubble
      message={item}
      isMine={
        String(item?.author?.id || item?.author?._id) === String(currentUserId)
      }
    />
  );

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
      keyExtractor={(item) => String(item?.id || item?._id)}
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
