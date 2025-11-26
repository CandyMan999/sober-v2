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
import { Ionicons } from "@expo/vector-icons";

const SHEET_HEIGHT = 360;

const FILTER_OPTIONS = [
  { label: "Nearby", icon: "location-outline" },
  { label: "Friends", icon: "people-outline" },
  { label: "Milestones", icon: "ribbon-outline" },
  { label: "Images", icon: "image-outline" },
];

const FilterSheet = ({ visible, onClose }) => {
  const [mounted, setMounted] = useState(visible);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(sheetAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
        mass: 1,
      }).start();
    } else {
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
        mass: 1,
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

  if (!mounted) return null;

  return (
    <Modal
      animationType="none"
      transparent
      visible={mounted}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Filter feed</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close filters">
              <Ionicons name="close" size={24} color="#e5e7eb" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Choose which posts to browse. Filters are coming soon.
          </Text>

          <View style={styles.optionGrid}>
            {FILTER_OPTIONS.map((option) => (
              <TouchableOpacity key={option.label} style={styles.optionButton}>
                <Ionicons name={option.icon} size={20} color="#f8fafc" />
                <Text style={styles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 14,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(148,163,184,0.14)",
    borderWidth: 1,
    borderColor: "rgba(248,250,252,0.16)",
    minWidth: "46%",
    marginRight: 12,
    marginBottom: 12,
    columnGap: 10,
  },
  optionLabel: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default FilterSheet;
