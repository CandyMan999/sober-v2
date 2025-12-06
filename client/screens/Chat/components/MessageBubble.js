import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

const MessageBubble = ({ message, isMine, onReply, currentUsername }) => {
  const author = message?.author || {};
  const timeLabel = formatTime(message?.createdAt);
  const replyTo = message?.replyTo;

  const handleReplyPress = () => {
    if (onReply) onReply(message);
  };

  const [replyExpanded, setReplyExpanded] = useState(false);

  const replyLabel = useMemo(() => {
    if (!replyTo) return null;
    const username = replyTo?.author?.username || "Someone";
    const previewText = replyTo?.text || "Original message";

    return {
      username,
      previewText,
      timestamp: formatTime(replyTo?.createdAt),
    };
  }, [replyTo]);

  const isReplyingToMe = useMemo(() => {
    if (!replyTo?.author?.username || !currentUsername) return false;
    return (
      replyTo.author.username.toLowerCase() === currentUsername.toLowerCase()
    );
  }, [currentUsername, replyTo?.author?.username]);

  const renderTextWithMentions = useMemo(() => {
    const content = message?.text || "";
    const mentionRegex = /@[A-Za-z0-9_]+/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = mentionRegex.exec(content))) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      const mentionText = match[0];
      const isMentioningCurrentUser = currentUsername
        ? mentionText.toLowerCase() === `@${currentUsername}`.toLowerCase()
        : false;

      parts.push(
        <Text
          key={`mention-${key}`}
          style={[
            styles.text,
            isMine ? styles.textMine : styles.textTheirs,
            styles.mention,
            isMentioningCurrentUser && styles.mentionHighlight,
          ]}
        >
          {mentionText}
        </Text>
      );

      key += 1;
      lastIndex = mentionRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  }, [currentUsername, isMine, message?.text]);

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
          userId={author.id || author._id}
          username={author.username}
        />
      ) : null}

      <View style={[styles.bubbleStack, isMine ? styles.bubbleStackMine : null]}>
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
            replyLabel && styles.bubbleWithReply,
          ]}
        >
          {replyLabel ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.replyContainer,
                isReplyingToMe && styles.replyToMe,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Replying to ${replyLabel.username}`}
              onPress={() => setReplyExpanded((prev) => !prev)}
            >
              <View style={styles.replyContent}>
                <Text
                  style={styles.replyTitle}
                  numberOfLines={replyExpanded ? undefined : 1}
                >
                  ↩︎ <Text style={styles.replyUsername}>{replyLabel.username}</Text>
                  {"  "}
                  <Text style={styles.replyTimestamp}>{replyLabel.timestamp}</Text>
                </Text>
                <Text
                  style={styles.replyPreview}
                  numberOfLines={replyExpanded ? undefined : 1}
                >
                  {replyLabel.previewText}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}

          <Text style={[styles.text, isMine ? styles.textMine : styles.textTheirs]}>
            {renderTextWithMentions}
          </Text>

          <View
            style={[
              styles.footerRow,
              isMine ? styles.footerRowMine : styles.footerRowTheirs,
            ]}
          >
            <Text
              style={[
                styles.timestamp,
                isMine ? styles.timestampMine : styles.timestampTheirs,
              ]}
              accessibilityLabel={`Sent ${timeLabel}`}
            >
              {timeLabel}
            </Text>
            {!isMine && onReply ? (
              <TouchableOpacity
                onPress={handleReplyPress}
                accessibilityRole="button"
                accessibilityLabel={`Reply to ${author.username || "message"}`}
                style={styles.replyButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="arrow-undo-outline" size={14} color="#cbd5e1" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {isMine ? (
        <Avatar
          uri={author.profilePicUrl}
          size={34}
          style={styles.avatar}
          fallbackText={author.username}
          haloColor="blue"
          userId={author.id || author._id}
          username={author.username}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
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
  replyButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 8,
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "100%",
    backgroundColor: "rgba(15,23,42,0.4)",
    borderRadius: 10,
    paddingLeft: 0,
    paddingRight: 0,
    paddingVertical: 2,
  },
  replyToMe: {
    backgroundColor: "rgba(244,114,182,0.14)",
  },
  replyContent: {
    flex: 1,
    gap: 2,
  },
  replyTitle: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 11,
  },
  replyUsername: {
    color: "#f59e0b",
  },
  replyPreview: {
    color: "#cbd5e1",
    fontSize: 11,
  },
  replyTimestamp: {
    color: "#94a3b8",
    fontSize: 10,
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  bubbleWithReply: {
    paddingTop: 0,
  },
  text: {
    fontSize: 14,
  },
  textMine: {
    color: "#e0f2fe",
    fontWeight: "600",
  },
  textTheirs: {
    color: "#fef3c7",
  },
  mention: {
    fontWeight: "700",
  },
  mentionHighlight: {
    color: "#0ea5e9",
    backgroundColor: "rgba(14,165,233,0.12)",
    paddingHorizontal: 2,
    borderRadius: 6,
  },
  timestamp: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 4,
  },
  timestampMine: {
    color: "#bae6fd",
    opacity: 0.9,
  },
  timestampTheirs: {
    color: "#fef9c3",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  footerRowMine: {
    justifyContent: "flex-end",
  },
  footerRowTheirs: {
    justifyContent: "flex-end",
  },
});

export default MessageBubble;
