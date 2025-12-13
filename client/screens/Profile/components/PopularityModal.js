import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { COLORS } from "../../../constants/colors";
import { defaultPopularityWeighting } from "../../../utils/popularity";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");

const ICON_ORANGE = "#f59e0b";

const POPULARITY_METRICS = [
  {
    key: "watchMinutes",
    label: "Watched",
    unit: "min",
    format: (value) => `${Math.round(value || 0)} min`,
    icon: { Component: Ionicons, name: "eye-outline", color: ICON_ORANGE },
  },
  {
    key: "posts",
    label: "Posts",
    unit: "posts",
    icon: { Component: FontAwesome6, name: "signs-post", color: ICON_ORANGE },
  },
  {
    key: "comments",
    label: "Comments",
    unit: "comments",
    icon: {
      Component: Ionicons,
      name: "chatbubble-ellipses-outline",
      color: ICON_ORANGE,
    },
  },
  {
    key: "likes",
    label: "Likes",
    unit: "likes",
    icon: {
      Component: Ionicons,
      name: "heart-outline",
      color: ICON_ORANGE,
    },
  },
  {
    key: "followers",
    label: "Followers",
    unit: "followers",
    icon: { Component: Feather, name: "users", color: ICON_ORANGE },
  },
  {
    key: "approvedQuotes",
    label: "Quotes",
    unit: "quotes",
    icon: {
      Component: MaterialCommunityIcons,
      name: "format-quote-close",
      color: ICON_ORANGE,
    },
  },
];

const { accent, accentSoft, textPrimary, textSecondary } = COLORS;

const PopularityModal = ({ visible, onClose, snapshot }) => {
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const status = snapshot?.status || "Getting Started";
  const score = Math.round(snapshot?.score || 0);
  const breakdown = snapshot?.breakdown || {};

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.setValue(0);
      Animated.spring(sheetAnim, {
        toValue: 1,
        damping: 16,
        stiffness: 140,
        mass: 0.8,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible, dragY, sheetAnim]);

  const effectiveHeight = sheetHeight || Math.round(WINDOW_HEIGHT * 0.7);

  const translateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [effectiveHeight, 0],
  });

  const dragTranslate = dragY.interpolate({
    inputRange: [0, effectiveHeight],
    outputRange: [0, effectiveHeight],
    extrapolate: "clamp",
  });

  const backdropOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
    onPanResponderMove: (_, g) => dragY.setValue(Math.max(g.dy, 0)),
    onPanResponderRelease: (_, g) => {
      if (g.dy > 70 || g.vy > 1) onClose?.();
      else
        Animated.spring(dragY, { toValue: 0, useNativeDriver: false }).start();
    },
  });

  const popularityEntries = useMemo(
    () =>
      POPULARITY_METRICS.map((metric) => {
        const value = Number(breakdown[metric.key]) || 0;
        const milestone =
          defaultPopularityWeighting?.[metric.key]?.milestone || 0;

        return {
          ...metric,
          value,
          progress: milestone ? Math.min(value / milestone, 1) : 0,
          displayValue: metric.format ? metric.format(value) : value,
          milestoneLabel: milestone
            ? `Goal: ${milestone} ${metric.unit}`
            : "Keep going",
        };
      }),
    [breakdown]
  );

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetWrapper,
            {
              transform: [
                { translateY: Animated.add(translateY, dragTranslate) },
              ],
            },
          ]}
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          {...panResponder.panHandlers}
        >
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />

            <View style={styles.headerRow}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.title}>Popularity Snapshot</Text>
                {/* ✅ subtitle restored */}
                <Text style={styles.subtitle}>
                  See how this member is trending across Sober Motivation in
                  real time.
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={22} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.badgePill}>
                <MaterialCommunityIcons
                  name="rocket-launch"
                  size={16}
                  color={ICON_ORANGE}
                />
                <Text style={styles.badgeText}>{status}</Text>
              </View>

              <View style={styles.scorePill}>
                <Text style={styles.scoreValue}>{score}%</Text>
                <Text style={styles.scoreLabel}>Momentum</Text>
              </View>
            </View>

            <Text style={styles.helperText}>
              They’re on the path to the next badge. Keep cheering them on.
            </Text>

            <View style={styles.grid}>
              {popularityEntries.map((m) => {
                const Icon = m.icon?.Component;
                return (
                  <View key={m.key} style={styles.chip}>
                    <View style={styles.chipHeader}>
                      <View style={styles.chipLeft}>
                        {Icon && (
                          <Icon
                            name={m.icon.name}
                            size={16}
                            color={m.icon.color}
                          />
                        )}
                        <Text style={styles.chipLabel}>{m.label}</Text>
                      </View>
                      <Text
                        style={[
                          styles.chipValue,
                          m.key === "watchMinutes" && styles.watchValue,
                        ]}
                      >
                        {m.displayValue}
                      </Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.max(m.progress * 100, 6)}%` },
                        ]}
                      />
                    </View>

                    <Text style={styles.milestone}>{m.milestoneLabel}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PopularityModal;

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000" },

  sheetWrapper: { position: "absolute", left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: "#0b1224",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },

  dragHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.4)",
    marginVertical: 12,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  headerTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: ICON_ORANGE,
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    color: textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 16,
    alignItems: "center",
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245,158,11,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: "#e5e7eb",
    fontWeight: "800",
    fontSize: 12,
  },

  scorePill: {
    backgroundColor: "rgba(249,115,22,0.18)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  scoreValue: {
    color: "#fef3c7",
    fontWeight: "900",
    fontSize: 14,
  },
  scoreLabel: {
    color: accentSoft,
    fontSize: 11,
  },

  helperText: {
    color: textSecondary,
    textAlign: "center",
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
  },

  chip: {
    width: "48%",
    backgroundColor: "rgba(245,158,11,0.08)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
  },
  chipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chipLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipLabel: {
    color: textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  chipValue: {
    color: textPrimary,
    fontWeight: "800",
  },
  watchValue: {
    fontSize: 12,
  },

  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: accent,
  },

  milestone: {
    color: textSecondary,
    fontSize: 11,
    marginTop: 6,
  },
});
