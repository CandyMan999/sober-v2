import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const SHEET_HEIGHT = 320;

const FILTER_OPTIONS = [
  { label: "Nearby", icon: "location-outline", badge: "Live" },
  { label: "Friends", icon: "people-outline" },
  { label: "Milestones", icon: "ribbon-outline" },
  { label: "Images", icon: "image-outline" },
];

const FilterSheet = ({ visible, onClose }) => {
  const [mounted, setMounted] = useState(visible);
  const [activeFilter, setActiveFilter] = useState("Nearby");
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
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
        outputRange: [SHEET_HEIGHT, 0],
      }),
    [sheetAnim]
  );

  const backdropOpacity = useMemo(
    () =>
      sheetAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.45],
      }),
    [sheetAnim]
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
            colors={["rgba(56,189,248,0.28)", "rgba(11,18,36,1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sheetGradient}
          >
            <View style={styles.sheetInner}>
              <View style={styles.dragHandle} />

              <View style={styles.headerRow}>
                <View style={styles.headerTextBlock}>
                  <Text style={styles.title}>Filter Posts</Text>
                  <Text style={styles.subtitle}>
                    Switch lanes without leaving the feed.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  accessibilityLabel="Close filters"
                  style={styles.closeButton}
                >
                  <Ionicons name="close-circle" size={30} color="#e5e7eb" />
                </TouchableOpacity>
              </View>

              <View style={styles.chipRow}>
                <View style={styles.chipPrimary}>
                  <Ionicons
                    name="sparkles-outline"
                    size={13}
                    color="#F59E0B"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.chipPrimaryText}>Smart Sort</Text>
                </View>
                <View style={styles.chipSecondary}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color="#38bdf8"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.chipSecondaryText}>Newest First</Text>
                </View>
              </View>

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Quick Filters</Text>
              </View>

              <View className="optionGrid" style={styles.optionGrid}>
                {FILTER_OPTIONS.map((option) => {
                  const isActive = activeFilter === option.label;
                  return (
                    <TouchableOpacity
                      key={option.label}
                      activeOpacity={0.9}
                      onPress={() => setActiveFilter(option.label)}
                      style={styles.optionTap}
                    >
                      <View
                        style={[
                          styles.optionButton,
                          isActive && styles.optionButtonActive,
                        ]}
                      >
                        {/* Live pill floating slightly above the badge when active */}
                        {option.badge && isActive && (
                          <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveBadgeText}>
                              {option.badge}
                            </Text>
                          </View>
                        )}

                        {/* Icon + label in one row */}
                        <View style={styles.optionHeaderRow}>
                          <View style={styles.optionIconShell}>
                            <LinearGradient
                              colors={
                                isActive
                                  ? ["#0ea5e9", "#6366f1"]
                                  : ["#020617", "#020617"]
                              }
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.optionIconHalo}
                            >
                              <Ionicons
                                name={option.icon}
                                size={20}
                                color={isActive ? "#F59E0B" : "#94a3b8"}
                              />
                            </LinearGradient>
                          </View>

                          <Text
                            style={[
                              styles.optionLabel,
                              isActive && styles.optionLabelActive,
                            ]}
                            numberOfLines={1}
                          >
                            {option.label}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
  sheetWrapper: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#0ea5e9", // blue glow
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  sheetGradient: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
    backgroundColor: "#0b1224",
  },
  sheetInner: {
    backgroundColor: "rgba(11,18,36,0.98)",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    backgroundColor: "rgba(148,163,184,0.6)",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: "#fef3c7",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 3,
  },
  closeButton: {
    marginLeft: 4,
    marginTop: -4,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  chipPrimary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.8)",
    marginRight: 8,
  },
  chipPrimaryText: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  chipSecondary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.8)",
  },
  chipSecondaryText: {
    color: "#38bdf8",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sectionTitle: {
    color: "#38bdf8",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  optionGrid: {
    marginTop: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // 2 per row
  },
  optionTap: {
    width: "48%", // 2 per row
    marginBottom: 8,
  },
  optionButton: {
    position: "relative",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(30,64,175,0.55)", // bluish for inactive
    backgroundColor: "#020617", // CHANGED: darker, more contrast than sheet
  },
  optionButtonActive: {
    borderColor: "#F59E0B",
    backgroundColor: "rgba(15,23,42,1)",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  optionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionIconShell: {
    marginRight: 8,
  },
  optionIconHalo: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
  },
  optionLabel: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "700",
  },
  optionLabelActive: {
    color: "#fefce8",
  },
  liveBadge: {
    position: "absolute",
    top: -8,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#020617", // CHANGED: dark background for LIVE
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#38bdf8",
    marginRight: 4,
  },
  liveBadgeText: {
    color: "#e0f2fe",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});

export default FilterSheet;
