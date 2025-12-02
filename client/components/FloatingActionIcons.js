import React, { useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeartFloatBurst from "./HeartFloatBurst";

const ACCENT = "#F59E0B";

const FloatingActionIcons = ({
  onLikePress,
  onCommentPress,
  onMorePress,
  onToggleSound,
  isMuted = false,
  showSoundToggle = false,
  likesCount = 0,
  commentsCount = 0,
  isLiked = false,
  onFilterPress,
  showFilter = true,
}) => {
  const heartScale = useRef(new Animated.Value(1)).current;
  const burstScale = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const likedGlow = useRef(new Animated.Value(isLiked ? 1 : 0)).current;
  const floatingHeartsRef = useRef(null);

  const formatCount = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const runHeartBeat = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.15,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const runBurst = () => {
    burstScale.setValue(0.4);
    burstOpacity.setValue(0.6);

    Animated.parallel([
      Animated.timing(burstScale, {
        toValue: 1.6,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(burstOpacity, {
        toValue: 0,
        duration: 240,
        delay: 80,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLikePress = () => {
    runHeartBeat();
    if (!isLiked) {
      runBurst();
      floatingHeartsRef.current?.burst();
    }
    onLikePress?.();
  };

  useEffect(() => {
    Animated.timing(likedGlow, {
      toValue: isLiked ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isLiked, likedGlow]);

  const heartIcon = isLiked ? "💖" : "❤️";
  const heartColor = isLiked ? "#fb7185" : "#fff";
  const likedGlowScale = likedGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.08],
  });

  return (
    <View style={styles.container}>
      {showFilter ? (
        <TouchableOpacity style={styles.pill} onPress={onFilterPress || (() => {})}>
          <Ionicons name="options-outline" size={20} color="#fff" />
        </TouchableOpacity>
      ) : null}

      {/* ❤️ Like */}
      <TouchableOpacity style={styles.pill} onPress={handleLikePress}>
        <View style={styles.heartWrapper}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.likedGlow,
              {
                opacity: likedGlow,
                transform: [{ scale: likedGlowScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartBurst,
              {
                opacity: burstOpacity,
                transform: [{ scale: burstScale }],
              },
            ]}
          />
          <Animated.Text
            style={[
              styles.icon,
              { color: heartColor, transform: [{ scale: heartScale }] },
            ]}
          >
            {heartIcon}
          </Animated.Text>
          {isLiked ? (
            <View style={styles.sentBadge}>
              <Text style={styles.sentBadgeText}>sent</Text>
            </View>
          ) : null}
          <HeartFloatBurst ref={floatingHeartsRef} />
        </View>
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
      {showSoundToggle ? (
        <TouchableOpacity
          onPress={onToggleSound}
          accessibilityRole="button"
          accessibilityLabel={isMuted ? "Unmute video" : "Mute video"}
        >
          <Text style={styles.soundIcon}>{isMuted ? "🔇" : "🔊"}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 18,
    bottom: 20,
    alignItems: "center",
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
  heartWrapper: {
    position: "relative",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  likedGlow: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(251, 113, 133, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(251, 113, 133, 0.5)",
    shadowColor: "#fb7185",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  heartBurst: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(251, 113, 133, 0.25)",
    shadowColor: "#fb7185",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  sentBadge: {
    position: "absolute",
    bottom: -10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(251, 113, 133, 0.6)",
  },
  sentBadgeText: {
    color: "#fb7185",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  countText: {
    marginLeft: 8,
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default FloatingActionIcons;
