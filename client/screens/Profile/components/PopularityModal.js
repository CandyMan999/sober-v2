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
import { LinearGradient } from "expo-linear-gradient";
import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { COLORS } from "../../../constants/colors";
import { defaultPopularityWeighting } from "../../../utils/popularity";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");

const POPULARITY_METRICS = [
  {
    key: "watchMinutes",
    label: "Watch time",
    unit: "min",
    format: (value) => `${Math.round(value || 0)} min`,
    icon: { Component: Ionicons, name: "eye-outline", color: "#38bdf8" },
  },
  {
    key: "posts",
    label: "Posts",
    unit: "posts",
    icon: { Component: FontAwesome6, name: "signs-post", color: "#f59e0b" },
  },
  {
    key: "comments",
    label: "Comments",
    unit: "comments",
    icon: { Component: Ionicons, name: "send", color: "#38bdf8" },
  },
  {
    key: "likes",
    label: "Likes",
    unit: "likes",
    emoji: "👍",
    iconBg: "rgba(59,130,246,0.08)",
    iconBorder: "rgba(59,130,246,0.4)",
  },
  {
    key: "followers",
    label: "Followers",
    unit: "followers",
    icon: { Component: Feather, name: "users", color: "#a78bfa" },
  },
  {
    key: "approvedQuotes",
    label: "Approved quotes",
    unit: "quotes",
    icon: {
      Component: MaterialCommunityIcons,
      name: "format-quote-close",
      color: "#38bdf8",
    },
  },
];

const { accent, accentSoft, textPrimary, textSecondary, nightBlue } = COLORS;

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
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
        }
      });
    }
  }, [dragY, sheetAnim, visible]);

  useEffect(() => {
    if (!visible) {
      dragY.setValue(0);
    }
  }, [dragY, visible]);

  const effectiveHeight = sheetHeight || Math.round(WINDOW_HEIGHT * 0.7);

  const translateY = useMemo(
    () =>
      sheetAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [effectiveHeight, 0],
      }),
    [effectiveHeight, sheetAnim]
  );

  const dragTranslate = useMemo(
    () =>
      dragY.interpolate({
        inputRange: [0, effectiveHeight],
        outputRange: [0, effectiveHeight],
        extrapolate: "clamp",
      }),
    [dragY, effectiveHeight]
  );

  const backdropOpacity = useMemo(
    () =>
      sheetAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.55],
      }),
    [sheetAnim]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 4,
        onPanResponderMove: (_, gestureState) => {
          const nextY = Math.max(gestureState.dy, 0);
          dragY.setValue(nextY);
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldClose = gestureState.dy > 70 || gestureState.vy > 1;

          if (shouldClose) {
            dragY.setValue(0);
            onClose?.();
            return;
          }

          Animated.spring(dragY, {
            toValue: 0,
            tension: 120,
            friction: 16,
            useNativeDriver: false,
          }).start();
        },
      }),
    [dragY, onClose]
  );

  const popularityEntries = useMemo(
    () =>
      POPULARITY_METRICS.map((metric) => {
        const value = Number(breakdown[metric.key]) || 0;
        const milestone = defaultPopularityWeighting?.[metric.key]?.milestone || 0;
        const progress = milestone ? Math.min(value / milestone, 1) : 0;
        const milestoneLabel = milestone
          ? `Goal: ${milestone} ${metric.unit || metric.label.toLowerCase()}`
          : "Keep going";

        return {
          ...metric,
          value,
          milestone,
          progress,
          displayValue: metric.format ? metric.format(value) : value,
          milestoneLabel,
        };
      }),
    [breakdown]
  );

  if (!mounted) return null;

  return (
    <Modal
      animationType="none"
      transparent
      visible={mounted}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetWrapper,
            { transform: [{ translateY: Animated.add(translateY, dragTranslate) }] },
          ]}
          onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
          {...panResponder.panHandlers}
        >
          <LinearGradient
            colors={["#0b1224", "#0b1224"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.sheetGradient}
          >
            <View style={styles.dragHandle} />

            <View style={styles.headerRow}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.title}>Their popularity snapshot</Text>
                <Text style={styles.subtitle}>
                  See how this member is trending across Sober Motivation in real time.
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                accessibilityLabel="Close popularity"
                style={styles.closeButton}
              >
                <Feather name="x" size={22} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.statusCard}>
              <View style={styles.statusLeft}>
                <View style={styles.iconBadge}>
                  <MaterialCommunityIcons
                    name="rocket-launch"
                    size={16}
                    color="#fef3c7"
                  />
                </View>
                <View>
                  <Text style={styles.statusLabel}>Their badge</Text>
                  <Text style={styles.statusValue}>{status}</Text>
                </View>
              </View>

              <View style={styles.scorePill}>
                <Text style={styles.scoreValue}>{`${score}%`}</Text>
                <Text style={styles.scoreHint}>Momentum</Text>
              </View>
            </View>

            <Text style={styles.helperText}>
              They’re on the path to the next badge. Celebrate their progress and
              keep cheering them on.
            </Text>

            <View style={styles.popularityGrid}>
              {popularityEntries.map((metric) => {
                const widthPercent = metric.progress * 100;
                const fillWidth = widthPercent > 0 ? Math.max(widthPercent, 6) : 0;

                const IconComponent = metric.icon?.Component;

                return (
                  <View key={metric.key} style={styles.popularityChip}>
                    <View style={styles.popularityChipHeader}>
                      <View style={styles.popularityChipLeft}>
                        <View
                          style={[
                            styles.metricIconBadge,
                            {
                              backgroundColor:
                                metric.iconBg || "rgba(56,189,248,0.12)",
                              borderColor:
                                metric.iconBorder || "rgba(56,189,248,0.35)",
                            },
                          ]}
                        >
                          {metric.emoji ? (
                            <Text style={styles.metricEmoji}>{metric.emoji}</Text>
                          ) : IconComponent ? (
                            <IconComponent
                              name={metric.icon.name}
                              color={metric.icon.color}
                              size={16}
                            />
                          ) : null}
                        </View>
                        <Text style={styles.popularityChipLabel}>{metric.label}</Text>
                      </View>
                      <Text style={styles.popularityChipValue}>
                        {metric.displayValue}
                      </Text>
                    </View>
                    <View style={styles.popularityProgressTrack}>
                      <View
                        style={[
                          styles.popularityProgressFill,
                          { width: `${fillWidth}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.popularityMilestone}>
                      {metric.milestoneLabel}
                    </Text>
                  </View>
                );
              })}
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PopularityModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheetWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  sheetGradient: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#0b1224",
    overflow: "hidden",
    paddingBottom: 24,
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  dragHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.5)",
    marginTop: 10,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: textPrimary,
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 6,
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
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(56,189,248,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.45)",
  },
  statusLabel: {
    color: textSecondary,
    fontSize: 12,
  },
  statusValue: {
    color: textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  scorePill: {
    backgroundColor: nightBlue,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.35)",
    alignItems: "center",
  },
  scoreValue: {
    color: "#fef3c7",
    fontWeight: "800",
    fontSize: 16,
  },
  scoreHint: {
    color: accentSoft,
    fontSize: 11,
    marginTop: 2,
  },
  helperText: {
    color: textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 20,
    marginTop: 12,
  },
  popularityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  popularityChip: {
    width: "48%",
    backgroundColor: "rgba(15,23,42,0.92)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  popularityChipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  popularityChipLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  metricEmoji: {
    fontSize: 16,
  },
  popularityChipLabel: {
    color: textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  popularityChipValue: {
    color: textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  popularityProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 8,
    overflow: "hidden",
  },
  popularityProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: accent,
  },
  popularityMilestone: {
    color: textSecondary,
    fontSize: 11,
    marginTop: 6,
  },
});
