import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { LiquidGlassView } from "@callstack/liquid-glass";
import { isIOSLiquidGlassCapable } from "../utils/deviceCapabilities";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ACCENT = "#fbbf24";
const HOLD_DURATION = 1400;

const QuickSobrietyBanner = ({
  daysSober,
  username,
  shouldPlay = true,
  playKey,
}) => {
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const canUseGlass = isIOSLiquidGlassCapable();

  useEffect(() => {
    if (!shouldPlay || !daysSober) return;

    slideAnim.setValue(-SCREEN_WIDTH);

    const animation = Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(HOLD_DURATION),
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 450,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [daysSober, playKey, shouldPlay, slideAnim]);

  if (!daysSober) return null;

  const bannerText = `${username || "Someone"} @ ${daysSober} sober`;

  const bannerContent = (
    <View style={styles.bannerContent} pointerEvents="none">
      <Text style={styles.bannerValue}>{bannerText}</Text>
    </View>
  );

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View
        style={[
          styles.bannerWrapper,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {canUseGlass ? (
          <LiquidGlassView
            interactive={false}
            effect="clear"
            tintColor="rgba(15,23,42,0.4)"
            colorScheme="system"
            style={styles.glassShell}
          >
            {bannerContent}
          </LiquidGlassView>
        ) : (
          <View style={styles.fallbackShell}>{bannerContent}</View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "26%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bannerWrapper: {
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glassShell: {
    minWidth: Math.min(SCREEN_WIDTH * 0.78, 320),
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.65)",
    backgroundColor: "transparent",
  },
  fallbackShell: {
    minWidth: Math.min(SCREEN_WIDTH * 0.78, 320),
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.65)",
    backgroundColor: "rgba(15,23,42,0.85)",
  },
  bannerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  bannerValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default QuickSobrietyBanner;
