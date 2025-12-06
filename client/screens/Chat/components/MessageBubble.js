import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatDistanceToNow } from "date-fns";

import Avatar from "../../../components/Avatar";

const parseDateValue = (value) => {
  if (!value) return null;
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    const fromNumeric = new Date(numeric);
    if (!Number.isNaN(fromNumeric.getTime())) return fromNumeric;
  }
  const fromString = new Date(value);
  return Number.isNaN(fromString.getTime()) ? null : fromString;
};

const formatTime = (timestamp) => {
  const parsed = parseDateValue(timestamp);
  if (!parsed) return "Just now";
  return `${formatDistanceToNow(parsed)} ago`;
};

const MessageBubble = ({ message, isMine }) => {
  const author = message?.author || {};
  const timeLabel = formatTime(message?.createdAt);

  return (
    <View
      style={[styles.row, isMine ? styles.rowMine : null]}
      accessibilityRole="text"
      accessibilityLabel={`Message from ${author.username || "User"}`}
    >
      {!isMine ? (
        <Avatar
          uri={author.profilePicUrl}
          size={36}
          style={styles.avatar}
          fallbackText={author.username}
        />
      ) : null}

      <View style={[styles.bubbleStack, isMine ? styles.bubbleStackMine : null]}>
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
          ]}
        >
          <Text
            style={[styles.text, isMine ? styles.textMine : styles.textTheirs]}
          >
            {message?.text || ""}
          </Text>
        </View>
        <Text
          style={[styles.timestamp, isMine ? styles.timestampMine : null]}
          accessibilityLabel={`Sent ${timeLabel}`}
        >
          {timeLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  avatar: {
    marginTop: 2,
  },
  bubbleStack: {
    flex: 1,
    alignItems: "flex-start",
  },
  bubbleStackMine: {
    alignItems: "flex-end",
  },
  bubble: {
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    maxWidth: "100%",
  },
  bubbleMine: {
    backgroundColor: "rgba(56,189,248,0.14)",
    borderColor: "#38bdf8",
    borderTopRightRadius: 6,
    alignSelf: "flex-end",
  },
  bubbleTheirs: {
    backgroundColor: "rgba(245,158,11,0.08)",
    borderColor: "#f59e0b",
    borderTopLeftRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 15,
  },
  textMine: {
    color: "#e0f2fe",
    fontWeight: "600",
  },
  textTheirs: {
    color: "#fef3c7",
  },
  timestamp: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 6,
  },
  timestampMine: {
    color: "#bae6fd",
    opacity: 0.9,
  },
});

export default MessageBubble;
