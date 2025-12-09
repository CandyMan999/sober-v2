import React, { useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LiquidGlassView } from "@callstack/liquid-glass";

import { isIOSLiquidGlassCapable } from "../utils/deviceCapabilities";

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

  const canUseGlass = isIOSLiquidGlassCapable();

  const formatCount = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const runHeartBeat = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 2.15,
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
        toValue: 2.6,
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
    }
    onLikePress?.();
  };

  const heartIcon = isLiked ? "🩵" : "❤️";
  const heartColor = isLiked ? "#fb7185" : "#fff";

  // Helper renderer for a pill (Liquid Glass vs fallback)
  const renderPill = (children, onPress) => {
    if (canUseGlass) {
      return (
        <TouchableOpacity
          style={styles.pillWrapper}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <LiquidGlassView
            style={styles.pillGlass}
            interactive
            effect="clear"
            tintColor="rgba(15,23,42,0.35)"
            colorScheme="system"
          >
            {children}
          </LiquidGlassView>
        </TouchableOpacity>
      );
    }

    // Fallback – original solid pill
    return (
      <TouchableOpacity style={styles.pill} onPress={onPress}>
        {children}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter */}
      {showFilter
        ? renderPill(
            <Ionicons name="options-outline" size={20} color="#fff" />,
            onFilterPress || (() => {})
          )
        : null}

      {/* ❤️ Like */}
      {renderPill(
        <>
          <View style={styles.heartWrapper}>
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
          </View>
          <Text style={styles.countText}>{formatCount(likesCount)}</Text>
        </>,
        handleLikePress
      )}

      {/* 💬 Comment */}
      {renderPill(
        <>
          <Text style={styles.icon}>💬</Text>
          <Text style={styles.countText}>{formatCount(commentsCount)}</Text>
        </>,
        onCommentPress
      )}

      {/* ⋯ More */}
      {renderPill(<Text style={styles.icon}>⋯</Text>, onMorePress)}

      {showSoundToggle ? (
        <TouchableOpacity
          onPress={onToggleSound}
          accessibilityRole="button"
          accessibilityLabel={isMuted ? "Unmute video" : "Mute video"}
          activeOpacity={0.9}
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

  // Wrapper glow for Liquid Glass version
  pillWrapper: {
    marginBottom: 12,
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // Glass interior style
  pillGlass: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    minWidth: 70,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.7)",
    backgroundColor: "transparent",
  },

  // Fallback solid pill (old UI)
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    minWidth: 70,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.7)",
    marginBottom: 12,
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
    width: 26,
    alignItems: "center",
    justifyContent: "center",
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
  countText: {
    marginLeft: 8,
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default FloatingActionIcons;
