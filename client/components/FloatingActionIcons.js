import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

const ACCENT = "#F59E0B";

const FloatingActionIcons = ({
  onLikePress,
  onCommentPress,
  onMorePress,
  onToggleSound,
  isMuted = false,
  showSoundToggle = false,
  showFlag = false,
  flagged = false,
  onFlagPress,
  likesCount = 0,
  commentsCount = 0,
}) => {
  const formatCount = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  return (
    <View style={styles.container}>
      {showSoundToggle ? (
        <TouchableOpacity
          style={[styles.soundButton, isMuted && styles.soundButtonMuted]}
          onPress={onToggleSound}
          accessibilityRole="button"
          accessibilityLabel={isMuted ? "Unmute video" : "Mute video"}
        >
          <Text style={styles.soundIcon}>{isMuted ? "🔇" : "🔊"}</Text>
        </TouchableOpacity>
      ) : null}

      {showFlag ? (
        <TouchableOpacity style={styles.pill} onPress={onFlagPress}>
          <Text style={styles.icon}>🚩</Text>
          <Text style={styles.countText}>{flagged ? "Flagged" : "Flag"}</Text>
        </TouchableOpacity>
      ) : null}

      {/* ❤️ Like */}
      <TouchableOpacity style={styles.pill} onPress={onLikePress}>
        <Text style={styles.icon}>❤️</Text>
        <Text style={styles.countText}>{formatCount(likesCount)}</Text>
      </TouchableOpacity>

      {/* 💬 Comment */}
      <TouchableOpacity style={styles.pill} onPress={onCommentPress}>
        <Text style={styles.icon}>💬</Text>
        <Text style={styles.countText}>{formatCount(commentsCount)}</Text>
      </TouchableOpacity>

      {/* ⋯ More – keep same width, but hide count */}
      <TouchableOpacity style={styles.pill} onPress={onMorePress}>
        <Text style={styles.icon}>⋯</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 18,
    bottom: 90,
    alignItems: "center",
  },
  soundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.7)",
    marginBottom: 14,
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  soundButtonMuted: {
    backgroundColor: "rgba(75,85,99,0.85)",
    borderColor: "rgba(156,163,175,0.9)",
  },
  soundIcon: {
    fontSize: 20,
    color: "#fff",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    minWidth: 70, // forces equal width
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.7)",
    marginBottom: 12,

    // Subtle glow
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  icon: {
    fontSize: 20,
    color: "#fff",
  },
  countText: {
    marginLeft: 8,
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default FloatingActionIcons;
