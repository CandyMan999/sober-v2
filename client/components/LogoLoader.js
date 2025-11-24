import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Image, Easing, Text } from "react-native";
import { BlurView } from "expo-blur";

import iOSLogo from "../assets/icon.png";

const ACCENT = "#F59E0B";

const LogoLoader = ({ scanning }) => {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );

    spinAnimation.start();
    return () => {
      spinAnimation.stop();
    };
  }, [rotateValue]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.overlay}>
      <BlurView intensity={25} tint="dark" style={styles.blurView}>
        <View style={styles.card}>
          <View style={styles.glowRing} />

          <View style={styles.logoWrapper}>
            <Animated.View
              style={[
                styles.logoContainer,
                { transform: [{ rotateY: rotate }] },
              ]}
            >
              <Image source={iOSLogo} style={styles.logo} />
            </Animated.View>
          </View>

          {scanning && (
            <>
              <Text style={styles.scanningText}>Processing for Nudity…</Text>
            </>
          )}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 24,
    // backgroundColor: "rgba(15,23,42,0.96",
    // borderWidth: 1,
    // borderColor: "rgba(148,163,184,0.35)",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  glowRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 999,
    // borderWidth: 1,
    // borderColor: "rgba(245,158,11,0.45)",
    opacity: 0.75,
    shadowColor: ACCENT,
    shadowOpacity: 0.8,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 8 },
  },
  logoWrapper: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "visible",
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 28,
  },
  scanningText: {
    color: "#f9fafb",
    marginTop: 20,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  subText: {
    color: "#9ca3af",
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
});

export default LogoLoader;
