import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

const HEART_COUNT = 10;
const BASE_DURATION = 900;
const HEART_EMOJIS = [
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💖",
  "💗",
  "💓",
  "💞",
  "💕",
  "💘",
  "💝",
  "❣️",
];

const createHeart = () => ({
  translateX: new Animated.Value(0),
  translateY: new Animated.Value(0),
  opacity: new Animated.Value(0),
  scale: new Animated.Value(0.9),
  rotation: new Animated.Value(0),
  id: Math.random().toString(36).slice(2, 8),
});

const HeartFloatBurst = forwardRef(({ size = 18, color }, ref) => {
  const heartsRef = useRef(Array.from({ length: HEART_COUNT }, createHeart));

  const burst = () => {
    heartsRef.current.forEach((heart) => {
      const emoji = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
      const driftX = (Math.random() - 0.5) * 120; // left/right sway
      const travelY = 80 + Math.random() * 70; // how far up it floats
      const wobble = (Math.random() - 0.5) * 1.2; // rotation direction
      const delay = Math.random() * 140;
      const duration = BASE_DURATION + Math.random() * 380 + delay;

      heart.translateX.setValue(0);
      heart.translateY.setValue(0);
      heart.opacity.setValue(0);
      heart.scale.setValue(0.9);
      heart.rotation.setValue(0);
      heart.emoji = emoji;

      Animated.parallel(
        [
          Animated.timing(heart.opacity, {
            toValue: 0.92,
            duration: 140,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(heart.translateY, {
            toValue: -travelY,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(heart.translateX, {
            toValue: driftX,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(heart.scale, {
            toValue: 1.25,
            duration: duration * 0.45,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(heart.rotation, {
            toValue: wobble,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(heart.opacity, {
            toValue: 0,
            duration: 260,
            delay: duration - 240,
            useNativeDriver: true,
          }),
        ],
        { stopTogether: false }
      ).start();
    });
  };

  useImperativeHandle(ref, () => ({ burst }));

  return (
    <Animated.View pointerEvents="none" style={styles.container}>
      {heartsRef.current.map((heart) => {
        const rotate = heart.rotation.interpolate({
          inputRange: [-1.2, 1.2],
          outputRange: ["-26deg", "26deg"],
        });

        return (
          <Animated.Text
            key={heart.id}
            style={[
              styles.heart,
              {
                fontSize: size,
                opacity: heart.opacity,
                transform: [
                  { translateX: heart.translateX },
                  { translateY: heart.translateY },
                  { scale: heart.scale },
                  { rotate },
                ],
                ...(color ? { color } : null),
              },
            ]}
          >
            {heart.emoji || "💖"}
          </Animated.Text>
        );
      })}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  heart: {
    position: "absolute",
    textShadowColor: "rgba(251, 113, 133, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});

HeartFloatBurst.displayName = "HeartFloatBurst";

export default HeartFloatBurst;
