import React from "react";
import { View, StyleSheet } from "react-native";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";

import { COLORS } from "../constants/colors";

const LiquidTabBar = (props) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  const barStyle = [
    styles.tabBar,
    { paddingBottom: bottomPadding, height: 68 + bottomPadding },
    props?.style,
  ];

  const tabBar = <BottomTabBar {...props} style={barStyle} />;

  if (!isLiquidGlassSupported) {
    return (
      <View style={[styles.fallbackWrapper, { paddingBottom: bottomPadding }]}>
        {tabBar}
      </View>
    );
  }

  return (
    <View style={{ paddingBottom: bottomPadding }}>
      <LiquidGlassView
        style={styles.glassWrapper}
        interactive
        effect="clear"
        colorScheme="system"
        tintColor="rgba(15,23,42,0.75)"
      >
        {tabBar}
      </LiquidGlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
  },
  glassWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    marginHorizontal: 12,
    backgroundColor: "rgba(5,8,22,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  fallbackWrapper: {
    marginHorizontal: 12,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: COLORS.primaryBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default LiquidTabBar;
