import React from "react";
import {
  ActivityIndicator,
  FlatList,
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
  contentPaddingBottom = 16,
}) => {
  const renderItem = ({ item }) => (
    <MessageBubble
      message={item}
      isMine={
        String(item?.author?.id || item?.author?._id) === String(currentUserId)
      }
    />
  );

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => String(item?.id || item?._id)}
      renderItem={renderItem}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: contentPaddingBottom },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
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
    paddingVertical: 12,
    gap: 12,
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
