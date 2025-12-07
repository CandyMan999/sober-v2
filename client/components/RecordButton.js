// RecordButton.js (Liquid Glass version)
import React, { useRef } from "react";
import { Animated, TouchableOpacity, StyleSheet, Easing } from "react-native";

import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from "@callstack/liquid-glass";

const SIZE = 70;
const RADIUS = SIZE / 2;

const RecordButton = ({ isRecording, startRecording, stopRecording }) => {
  const animatedButtonSize = useRef(new Animated.Value(1)).current;
  const animatedInnerShape = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    if (isRecording) {
      stopRecording();
      Animated.timing(animatedButtonSize, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(animatedInnerShape, {
        toValue: 1,
        duration: 200,
        easing: Easing.bounce,
        useNativeDriver: true,
      }).start();
    } else {
      startRecording();
      Animated.timing(animatedButtonSize, {
        toValue: 2,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(animatedInnerShape, {
        toValue: 0,
        duration: 200,
        easing: Easing.bounce,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View
        style={[
          styles.shadowWrapper,
          { transform: [{ scale: animatedButtonSize }] },
        ]}
      >
        <LiquidGlassView
          style={[
            styles.glassShell,
            !isLiquidGlassSupported && styles.glassFallback,
          ]}
          interactive
          effect="clear"
          tintColor="rgba(255,255,255,0.25)" // tweak for brand / theme
          colorScheme="system"
        >
          <Animated.View
            style={[
              styles.recordInnerButton,
              {
                backgroundColor: "red",
                borderRadius: animatedInnerShape.interpolate({
                  inputRange: [0, 1],
                  outputRange: [5, 50], // square -> circle
                }),
                transform: [
                  {
                    scale: animatedInnerShape.interpolate({
                      inputRange: [0, 0.6],
                      outputRange: [0.6, 0.6],
                    }),
                  },
                ],
              },
            ]}
          />
        </LiquidGlassView>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  glassShell: {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  glassFallback: {
    // When Liquid Glass isn't supported (current iOS / Android),
    // fall back to a translucent dark circle instead of solid black.
    backgroundColor: "rgba(15,23,42,0.85)",
  },
  recordInnerButton: {
    width: 50,
    height: 50,
  },
});

export default RecordButton;
