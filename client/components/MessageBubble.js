import React from "react";
import { TouchableOpacity, Text, Animated, StyleSheet } from "react-native";
import { LiquidGlassView } from "@callstack/liquid-glass";

const MessageBubble = ({
  bubbleTint,
  isMine,
  isCompanionAuthor,
  likeScale,
  likeOpacity,
  onPress,
  text,
  timestamp,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <LiquidGlassView
        interactive
        effect="clear"
        tintColor={bubbleTint}
        colorScheme="system"
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          !isMine && isCompanionAuthor ? styles.bubbleCompanion : null,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.likeBadge,
            isMine
              ? styles.likeBadgeMine
              : isCompanionAuthor
              ? styles.likeBadgeCompanion
              : styles.likeBadgeTheirs,
            {
              opacity: likeOpacity,
              transform: [{ scale: likeScale }],
            },
          ]}
        >
          <Text style={styles.likeBadgeText}>👍</Text>
        </Animated.View>
        <Text
          style={[
            styles.messageText,
            isMine
              ? styles.messageTextMine
              : isCompanionAuthor
              ? styles.messageTextCompanion
              : styles.messageTextTheirs,
          ]}
        >
          {text}
        </Text>
        <Text style={[styles.timestamp, isMine && styles.timestampMine]}>
          {timestamp}
        </Text>
      </LiquidGlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bubble: {
    padding: 12,
    borderRadius: 14,
    borderCurve: "continuous",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    gap: 6,
  },
  bubbleMine: {
    backgroundColor: "rgba(59,130,246,0.16)",
    borderTopRightRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.45)",
  },
  bubbleTheirs: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
  },
  bubbleCompanion: {
    backgroundColor: "rgba(52,211,153,0.14)",
    borderColor: "rgba(52,211,153,0.45)",
  },
  messageText: {
    fontSize: 15,
  },
  messageTextMine: {
    color: "#e0f2fe",
    fontWeight: "600",
  },
  messageTextTheirs: {
    color: "#fef3c7",
  },
  messageTextCompanion: {
    color: "#d1fae5",
    fontWeight: "600",
  },
  timestamp: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-start",
    textAlign: "left",
  },
  timestampMine: {
    color: "#bae6fd",
    opacity: 0.9,
    alignSelf: "flex-end",
    textAlign: "right",
  },
  likeBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  likeBadgeMine: {
    left: -6,
  },
  likeBadgeTheirs: {
    right: -12,
  },
  likeBadgeCompanion: {
    right: -12,
    borderColor: "rgba(52,211,153,0.4)",
  },
  likeBadgeText: {
    fontSize: 14,
  },
});

export default MessageBubble;
