import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Avatar from "../../../components/Avatar";
import TypingIndicator from "../../../components/TypingIndicator";
import MessageBubble from "./MessageBubble";
import { MESSAGE_STYLE_PRESETS } from "./messageStyles";

const MessageList = ({
  messages,
  currentUserId,
  loading,
  onRefresh,
  lastMessageId,
  contentPaddingBottom = 0,
  doneLoading,
  onReply,
  currentUsername,
  onPressMessage,
}) => {
  const listRef = useRef(null);
  const [distanceFromBottom, setDistanceFromBottom] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const initialScrollDone = useRef(false);
  const lastMessageIdRef = useRef(undefined);
  const typingKeysRef = useRef([]);
  const scrollMetricsRef = useRef({
    offsetY: 0,
    contentHeight: 0,
    layoutHeight: 0,
  });

  const autoScrollThreshold = useMemo(
    () => Math.max(viewportHeight * 0.8, 0),
    [viewportHeight]
  );
  const shouldAutoScroll = distanceFromBottom <= autoScrollThreshold;

  const getStyleVariant = useMemo(
    () =>
      (item) => {
        const styleIndex =
          typeof item?.messageStyle === "number"
            ? item.messageStyle
            : typeof item?.author?.messageStyle === "number"
            ? item.author.messageStyle
            : undefined;

        if (typeof styleIndex !== "number") return undefined;
        const normalized = ((styleIndex % MESSAGE_STYLE_PRESETS.length) +
          MESSAGE_STYLE_PRESETS.length) %
          MESSAGE_STYLE_PRESETS.length;
        return MESSAGE_STYLE_PRESETS[normalized];
      },
    []
  );

  const renderItem = ({ item }) => {
    const styleVariant = getStyleVariant(item);
    if (item?.__typingIndicator) {
      const accentColor = styleVariant?.accentColor || "#f59e0b";
      const bubbleColor =
        styleVariant?.bubble?.backgroundColor || "rgba(11,18,32,0.95)";
      const borderColor = styleVariant?.bubble?.borderColor || "rgba(148,163,184,0.35)";

      return (
        <View style={styles.typingRow}>
          <Avatar
            uri={item.profilePicUrl}
            size={30}
            disableNavigation
            haloColors={styleVariant?.haloColors}
          />
          <TypingIndicator
            username={item.username || "Someone"}
            accentColor={accentColor}
            bubbleColor={bubbleColor}
            borderColor={borderColor}
            dotColor={accentColor}
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
        onReply={onReply}
        currentUsername={currentUsername}
        onPress={onPressMessage ? () => onPressMessage(item) : undefined}
        styleVariant={styleVariant}
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
    if (!doneLoading) return undefined;

    const timeout = setTimeout(() => {
      scrollToBottom(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, [doneLoading]);

  useEffect(() => {
    if (!messages?.length) return;

    const isFirstMessage = !initialScrollDone.current;
    const isNewMessage =
      !!lastMessageIdRef.current && lastMessageIdRef.current !== lastMessageId;

    if (isFirstMessage) {
      scrollToBottom(false);
      initialScrollDone.current = true;
    } else if (isNewMessage && shouldAutoScroll) {
      scrollToBottom(true);
    }

    lastMessageIdRef.current = lastMessageId || lastMessageIdRef.current;
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

  const updateDistanceFromMetrics = (metrics) => {
    const { offsetY, contentHeight, layoutHeight } = metrics;
    const distance = Math.max(contentHeight - layoutHeight - offsetY, 0);
    setDistanceFromBottom(distance);
  };

  const handleScroll = (event) => {
    const {
      contentOffset: { y: offsetY },
      contentSize: { height: contentHeight },
      layoutMeasurement: { height: layoutHeight },
    } = event.nativeEvent;

    setViewportHeight(layoutHeight);

    scrollMetricsRef.current = { offsetY, contentHeight, layoutHeight };
    updateDistanceFromMetrics(scrollMetricsRef.current);
  };

  const handleLayout = (event) => {
    const { height } = event.nativeEvent.layout || {};
    if (height) {
      setViewportHeight(height);
      scrollMetricsRef.current = {
        ...scrollMetricsRef.current,
        layoutHeight: height,
      };
      updateDistanceFromMetrics(scrollMetricsRef.current);
    }
  };

  const handleContentSizeChange = (_width, height) => {
    scrollMetricsRef.current = {
      ...scrollMetricsRef.current,
      contentHeight: height || scrollMetricsRef.current.contentHeight,
    };
    updateDistanceFromMetrics(scrollMetricsRef.current);

    if (!initialScrollDone.current && lastMessageId && messages?.length) {
      scrollToBottom(false);
      initialScrollDone.current = true;
      lastMessageIdRef.current = lastMessageId;
    }
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
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
            <Image
              source={require("../../../assets/icon.png")}
              style={styles.emptyLogo}
              resizeMode="contain"
            />

            {loading ? (
              <ActivityIndicator size="small" color="#f59e0b" />
            ) : (
              <View style={styles.emptyCopy}>
                <Text style={styles.emptyHeadline}>Join the chat</Text>
                <Text style={styles.emptyText}>
                  Say hello or share an update. Messages from everyone in the
                  room will show up here.
                </Text>
              </View>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 6,
    gap: 10,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
    paddingTop: 2,
  },
  emptyState: {
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: "center",
    gap: 16,
  },
  emptyLogo: {
    width: 124,
    height: 124,
    opacity: 0.32,
  },
  emptyCopy: {
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyHeadline: {
    color: "#f59e0b",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "#cbd5e1",
    textAlign: "center",
    fontSize: 14,
  },
});

export default MessageList;
