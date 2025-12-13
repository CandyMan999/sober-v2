import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "../../../constants/colors";
import { defaultPopularityWeighting } from "../../../utils/popularity";

const POPULARITY_METRICS = [
  {
    key: "watchMinutes",
    label: "Watch time",
    unit: "min",
    format: (value) => `${Math.round(value || 0)} min`,
  },
  { key: "posts", label: "Posts", unit: "posts" },
  { key: "comments", label: "Comments", unit: "comments" },
  { key: "likes", label: "Likes", unit: "likes" },
  { key: "followers", label: "Followers", unit: "followers" },
  { key: "approvedQuotes", label: "Approved quotes", unit: "quotes" },
];

const {
  primaryBackground,
  cardBackground,
  accent,
  accentSoft,
  textPrimary,
  textSecondary,
  border,
  nightBlue,
} = COLORS;

const PopularityModal = ({ visible, onClose, snapshot }) => {
  const [mounted, setMounted] = useState(visible);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const status = snapshot?.status || "Getting Started";
  const score = Math.round(snapshot?.score || 0);
  const breakdown = snapshot?.breakdown || {};

  useEffect(() => {
    if (visible) {
      setMounted(true);
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
  }, [sheetAnim, visible]);

  const translateY = useMemo(
    () =>
      sheetAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [180, 0],
      }),
    [sheetAnim]
  );

  const backdropOpacity = useMemo(
    () =>
      sheetAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.55],
      }),
    [sheetAnim]
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
          style={[styles.sheetWrapper, { transform: [{ translateY }] }]}
        >
          <LinearGradient
            colors={["rgba(56,189,248,0.35)", "rgba(11,18,32,0.98)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sheetGradient}
          >
            <View style={styles.dragHandle} />

            <View style={styles.headerRow}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.title}>Popularity status</Text>
                <Text style={styles.subtitle}>
                  Celebrate the momentum you’re building across Sober Motivation.
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
                  <Text style={styles.statusLabel}>Current badge</Text>
                  <Text style={styles.statusValue}>{status}</Text>
                </View>
              </View>

              <View style={styles.scorePill}>
                <Text style={styles.scoreValue}>{`${score}%`}</Text>
                <Text style={styles.scoreHint}>Momentum</Text>
              </View>
            </View>

            <Text style={styles.helperText}>
              Hit each milestone to unlock the next badge. Keep sharing, engaging,
              and cheering others on.
            </Text>

            <View style={styles.popularityGrid}>
              {popularityEntries.map((metric) => {
                const widthPercent = metric.progress * 100;
                const fillWidth = widthPercent > 0 ? Math.max(widthPercent, 6) : 0;

                return (
                  <View key={metric.key} style={styles.popularityChip}>
                    <View style={styles.popularityChipHeader}>
                      <Text style={styles.popularityChipLabel}>{metric.label}</Text>
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheetWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  sheetGradient: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.28)",
    backgroundColor: primaryBackground,
    overflow: "hidden",
    paddingBottom: 20,
  },
  dragHandle: {
    alignSelf: "center",
    width: 58,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginTop: 10,
    marginBottom: 12,
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
    backgroundColor: cardBackground,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: border,
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
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.45)",
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
    backgroundColor: cardBackground,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: border,
  },
  popularityChipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
