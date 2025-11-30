import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

const TypingIndicator = ({
  username = "Someone",
  accentColor = "#f59e0b",
  bubbleColor = "rgba(11,18,32,0.95)",
  borderColor = "rgba(148,163,184,0.35)",
  dotColor = "#f59e0b",
}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const bubbleScale = useRef(new Animated.Value(0.9)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();

    const makeDotLoop = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
        { resetBeforeIteration: true }
      );

    const dot1Anim = makeDotLoop(dot1, 0);
    const dot2Anim = makeDotLoop(dot2, 140);
    const dot3Anim = makeDotLoop(dot3, 280);

    dot1Anim.start();
    dot2Anim.start();
    dot3Anim.start();

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
      bubbleScale.stopAnimation();
      bubbleOpacity.stopAnimation();
    };
  }, [bubbleOpacity, bubbleScale, dot1, dot2, dot3]);

  const renderDot = (animatedValue) => (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: dotColor,
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [2, -3],
              }),
            },
          ],
        },
      ]}
    />
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: bubbleOpacity,
          transform: [{ scale: bubbleScale }],
          backgroundColor: bubbleColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.username, { color: accentColor }]} numberOfLines={1}>
          {username}
        </Text>
        <Text style={styles.label}>is typing</Text>
      </View>

      <View style={styles.bubbleRow}>
        {renderDot(dot1)}
        {renderDot(dot2)}
        {renderDot(dot3)}
      </View>

      <View style={[styles.tail, { backgroundColor: bubbleColor, borderColor }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    maxWidth: "72%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 8,
    marginLeft: 8,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  username: {
    fontWeight: "700",
    fontSize: 13,
    marginRight: 6,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 11,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 5,
  },
  tail: {
    position: "absolute",
    left: 10,
    bottom: -4,
    width: 10,
    height: 10,
    transform: [{ rotate: "45deg" }],
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
});

export default TypingIndicator;
