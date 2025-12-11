import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LiquidGlassView } from "@callstack/liquid-glass";
import { Ionicons } from "@expo/vector-icons";

import { isIOSLiquidGlassCapable } from "../utils/deviceCapabilities";

const ACCENT = "#fbbf24";

const SobrietyBadge = ({ daysSober }) => {
  if (typeof daysSober !== "number" || daysSober <= 0) {
    return null;
  }

  const canUseGlass = isIOSLiquidGlassCapable();
  const subtitle = "days sober when posted";

  const content = (
    <View style={styles.content} pointerEvents="none">
      <View style={styles.row}>
        <Ionicons name="sparkles" size={16} color={ACCENT} />
        <Text style={styles.valueText}>{daysSober}</Text>
      </View>
      <Text style={styles.label}>{subtitle}</Text>
    </View>
  );

  return canUseGlass ? (
    <LiquidGlassView
      interactive={false}
      effect="clear"
      tintColor="rgba(15,23,42,0.4)"
      colorScheme="system"
      style={styles.glassShell}
    >
      {content}
    </LiquidGlassView>
  ) : (
    <View style={styles.fallbackShell}>{content}</View>
  );
};

const styles = StyleSheet.create({
  glassShell: {
    minWidth: 150,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.7)",
    backgroundColor: "transparent",
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  fallbackShell: {
    minWidth: 150,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.7)",
    backgroundColor: "rgba(15,23,42,0.9)",
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  valueText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  label: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

export default SobrietyBadge;
