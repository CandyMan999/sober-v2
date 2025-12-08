// components/WatchAgainButton.js
import React from "react";
import { TouchableOpacity, StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from "@callstack/liquid-glass";

const HEIGHT = 44;
const RADIUS = HEIGHT / 2;

const WatchAgainButton = ({ onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.shadowWrapper}
    >
      <LiquidGlassView
        style={[
          styles.glassShell,
          !isLiquidGlassSupported && styles.glassFallback,
        ]}
        interactive
        effect="clear"
        tintColor="rgba(255,255,255,0.25)" // matches RecordButton vibe
        colorScheme="system"
      >
        <View style={styles.contentRow}>
          <Ionicons name="refresh" size={20} color="#fef3c7" />
          <Text style={styles.label}>Watch Again</Text>
        </View>
      </LiquidGlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    minWidth: 180,
    height: HEIGHT,
    borderRadius: RADIUS,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  glassShell: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: RADIUS,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  glassFallback: {
    backgroundColor: "rgba(15,23,42,0.85)",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 10,
  },
  label: {
    color: "#fef3c7",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.4,
  },
});

export default WatchAgainButton;
