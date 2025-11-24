// RecordButton.js (glass like Snack; animations unchanged)
import React, { useRef } from "react";
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  Easing,
  View,
  StyleSheet as RNStyleSheet,
} from "react-native";

// import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

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
      // const { sound } = await Audio.Sound.createAsync(
      //   require("../sounds/startVideo.mp3")
      // );
      // await sound.playAsync();
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
          styles.recordButton,
          { transform: [{ scale: animatedButtonSize }] }, // <-- unchanged animation
        ]}
      >
        {/* Glass layer (same structure as Snack) */}
        <View style={styles.glassWrap}>
          {/* Backdrop blur */}
          <BlurView
            intensity={20}
            tint="light"
            style={RNStyleSheet.absoluteFill}
          />

          {/* White rim / stroke */}
          <View style={styles.whiteRim} />

          {/* Specular highlight (top-left) */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.70)",
              "rgba(255,255,255,0.15)",
              "transparent",
            ]}
            locations={[0, 0.25, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.9, y: 0.9 }}
            style={RNStyleSheet.absoluteFill}
          />

          {/* Subtle inner shadow (bottom-right) */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.08)"]}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={RNStyleSheet.absoluteFill}
          />
        </View>

        {/* Your original animated inner shape (UNCHANGED math) */}
        <Animated.View
          style={[
            styles.recordInnerButton,
            {
              backgroundColor: isRecording ? "red" : "red",
              borderRadius: animatedInnerShape.interpolate({
                inputRange: [0, 1],
                outputRange: [5, 50], // square -> circle
              }),
              transform: [
                {
                  scale: animatedInnerShape.interpolate({
                    inputRange: [0, 0.6],
                    outputRange: [0.6, 0.6], // constant 0.6 (same as yours)
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const SIZE = 70;
const RADIUS = SIZE / 2;

const styles = StyleSheet.create({
  recordButton: {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    justifyContent: "center",
    alignItems: "center",
    // Keep it like the Snack (thin white ring outside)
    borderWidth: 0,
    borderColor: "rgba(255,255,255,0.55)",

    // Raised look
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,

    backgroundColor: "transparent",
    overflow: "hidden", // clips the glass layers perfectly to the circle
  },

  glassWrap: {
    ...RNStyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  whiteRim: {
    ...RNStyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },

  recordInnerButton: {
    width: 50,
    height: 50,
  },
});

export default RecordButton;
