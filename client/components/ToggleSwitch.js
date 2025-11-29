import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from "react-native";

import { COLORS } from "../constants/colors";

const TRACK_WIDTH = 58;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 24;
const PADDING = 4;

const ToggleSwitch = ({
  value = false,
  onValueChange,
  activeColor = COLORS.accent,
  disabled = false,
}) => {
  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: value ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, animation]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, TRACK_WIDTH - THUMB_SIZE - PADDING],
  });

  const trackColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["#1f2937", activeColor],
  });

  const trackBorder = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["#374151", activeColor],
  });

  const thumbScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.07],
  });

  const shadowOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.35],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => !disabled && onValueChange?.(!value)}
      disabled={disabled}
      style={styles.touchable}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: trackColor,
            borderColor: trackBorder,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }, { scale: thumbScale }],
              shadowOpacity,
              shadowColor: activeColor,
            },
          ]}
        >
          <View style={styles.thumbInner} />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    paddingLeft: 8,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: "center",
    paddingVertical: PADDING,
    paddingHorizontal: 0,
    borderWidth: 1,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#e5e7eb",
    shadowColor: COLORS.accent,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  thumbInner: {
    flex: 1,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.1)",
  },
});

export default ToggleSwitch;
