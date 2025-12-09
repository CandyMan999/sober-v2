import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from "@callstack/liquid-glass";

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

const MessageBubble = ({
  message,
  isMine,
  onReply,
  currentUsername,
  onPress,
  styleVariant,
}) => {
  const author = message?.author || {};
  const timeLabel = formatTime(message?.createdAt);
  const replyTo = message?.replyTo;
  const accentColor = isMine
    ? "#38bdf8"
    : styleVariant?.accentColor || "#f59e0b";
  const bubbleColors = !isMine ? styleVariant?.bubble || {} : {};
  const likesCount = message?.likesCount || 0;
  const showLikeBadge = likesCount > 0;

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

  const isMentioningMe = useMemo(() => {
    if (!currentUsername) return false;
    const content = message?.text || "";
    const mentionRegex = new RegExp(
      `@${currentUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\b|[^A-Za-z0-9_])`,
      "i"
    );
    return mentionRegex.test(content);
  }, [currentUsername, message?.text]);

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

  const tintColor = isMine ? "rgba(56,189,248,0.25)" : "rgba(245,158,11,0.20)";

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
          haloColors={styleVariant?.haloColors}
          userId={author.id || author._id}
          username={author.username}
        />
      ) : null}

      <View
        style={[styles.bubbleStack, isMine ? styles.bubbleStackMine : null]}
      >
        {!isMine ? (
          <Text
            style={[
              styles.username,
              { color: accentColor },
              styleVariant?.usernameColor
                ? { color: styleVariant.usernameColor }
                : null,
            ]}
            numberOfLines={1}
          >
            {author.username || "User"}
          </Text>
        ) : null}
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
          <LiquidGlassView
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleTheirs,
              replyLabel && styles.bubbleWithReply,
              !isMine && bubbleColors.backgroundColor
                ? { backgroundColor: bubbleColors.backgroundColor }
                : null,
              !isMine && bubbleColors.borderColor
                ? { borderColor: bubbleColors.borderColor }
                : null,
              !isMine && bubbleColors.shadowColor
                ? {
                    shadowColor: bubbleColors.shadowColor,
                    shadowOpacity: 0.9,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 8,
                  }
                : null,
              isMentioningMe && !isMine
                ? [
                    styles.bubbleMention,
                    styles.bubbleMentionGlow,
                    { shadowColor: "rgba(255,255,255,0.95)" },
                    {
                      borderColor: bubbleColors.borderColor || "#ffffff",
                      backgroundColor:
                        bubbleColors.backgroundColor || "rgba(255,255,255,0.12)",
                    },
                  ]
                : null,
            ]}
            interactive
            effect="clear"
            tintColor={tintColor}
            colorScheme="system"
          >
            {showLikeBadge ? (
              <View
                style={[
                  styles.likeBadge,
                  isMine
                    ? styles.likeBadgeMine
                    : [
                        styles.likeBadgeTheirs,
                        styleVariant?.accentColor
                          ? { backgroundColor: styleVariant.accentColor }
                          : null,
                        bubbleColors.borderColor
                          ? { borderColor: bubbleColors.borderColor }
                          : null,
                      ],
                ]}
              >
                <Text style={styles.likeBadgeText}>👍</Text>
                {likesCount > 1 ? (
                  <Text style={styles.likeBadgeCount}>{likesCount}</Text>
                ) : null}
              </View>
            ) : null}

            {replyLabel ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.replyContainer,
                  {
                    borderLeftColor:
                      bubbleColors.replyBorderColor || accentColor,
                  },
                  isReplyingToMe && styles.replyToMe,
                  isReplyingToMe && {
                    shadowColor: bubbleColors.shadowColor || accentColor,
                  },
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
                    <Text style={styles.replyLabel}>Reply to </Text>
                    <Text style={styles.replyUsername}>
                      {replyLabel.username}
                    </Text>
                    {replyLabel.timestamp ? (
                      <Text style={styles.replyTimestamp}>
                        {"  "}
                        {replyLabel.timestamp}
                      </Text>
                    ) : null}
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

            <Text
              style={[
                styles.text,
                isMine ? styles.textMine : styles.textTheirs,
                !isMine && bubbleColors.textColor
                  ? { color: bubbleColors.textColor }
                  : null,
              ]}
            >
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
                  !isMine && bubbleColors.timestampColor
                    ? { color: bubbleColors.timestampColor }
                    : null,
                ]}
                accessibilityLabel={`Sent ${timeLabel}`}
              >
                {timeLabel}
              </Text>
              {!isMine && onReply ? (
                <TouchableOpacity
                  onPress={handleReplyPress}
                  accessibilityRole="button"
                  accessibilityLabel={`Reply to ${
                    author.username || "message"
                  }`}
                  style={styles.replyButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="arrow-undo-outline"
                    size={14}
                    color="#cbd5e1"
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </LiquidGlassView>
        </TouchableOpacity>
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
  username: {
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    paddingLeft: 4,
  },
  replyButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 8,
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    borderLeftWidth: 2,
    borderLeftColor: "rgba(255,255,255,0.85)",
    paddingLeft: 8,
    paddingRight: 0,
    paddingVertical: 2,
    marginRight: 0,
  },
  replyToMe: {
    shadowColor: "rgba(59,130,246,0.45)",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  replyContent: {
    flex: 1,
    gap: 2,
  },
  replyTitle: {
    color: "#e2e8f0",
    fontWeight: "600",
    fontSize: 11,
  },
  replyLabel: {
    color: "#e2e8f0",
    opacity: 0.9,
  },
  replyUsername: {
    color: "#fef3c7",
    fontWeight: "700",
  },
  replyPreview: {
    color: "#cbd5e1",
    fontSize: 11,
    marginTop: 1,
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
    position: "relative",
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
  bubbleMention: {
    shadowColor: "rgba(255,255,255,0.95)",
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  bubbleMentionGlow: {
    borderWidth: 3,
    shadowRadius: 24,
    shadowOpacity: 1,
    elevation: 18,
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
  likeBadge: {
    position: "absolute",
    top: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeBadgeMine: {
    backgroundColor: "#0ea5e9",
    opacity: 1,
    zIndex: 100,
    borderWidth: 1,
    borderColor: "#0284c7",
    left: -6,
  },
  likeBadgeTheirs: {
    backgroundColor: "#f59e0b",
    borderWidth: 1,
    borderColor: "#b45309",
    right: -6,
  },
  likeBadgeText: {
    fontSize: 12,
    color: "#fef3c7",
  },
  likeBadgeCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fef3c7",
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
