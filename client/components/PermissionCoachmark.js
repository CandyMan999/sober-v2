import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/colors";

const { accent, accentSoft } = COLORS;

const PulsingIndicator = ({ color = accent }) => {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.85,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity, scale]);

  return (
    <View style={styles.indicatorWrapper} pointerEvents="none">
      <Animated.View
        style={[
          styles.indicatorHalo,
          { borderColor: color, transform: [{ scale }], opacity },
        ]}
      />
      <View style={[styles.indicatorDot, { backgroundColor: color }]} />
    </View>
  );
};

const PermissionCoachmark = ({
  visible,
  title,
  message,
  confirmLabel = "Allow",
  cancelLabel = "Don't Allow",
  onConfirm,
  onCancel,
  indicatorColor = accent,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.promptCard}>
          <Text style={styles.promptTitle}>{title}</Text>
          <Text style={styles.promptMessage}>{message}</Text>

          <View style={styles.promptActions}>
            <TouchableOpacity style={styles.actionButton} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <View style={styles.actionButton}>
              <TouchableOpacity
                style={styles.allowButton}
                activeOpacity={0.9}
                onPress={onConfirm}
              >
                <LinearGradient
                  colors={[indicatorColor, accentSoft]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.allowGradient}
                >
                  <Text style={styles.allowText}>{confirmLabel}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.floatingIndicator}>
                <PulsingIndicator color={indicatorColor} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  promptCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  promptMessage: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  promptActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  actionButton: { flex: 1, alignItems: "center" },
  cancelText: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "600",
  },
  allowButton: {
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 120,
  },
  allowGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  allowText: {
    color: "#0B1221",
    fontSize: 16,
    fontWeight: "700",
  },
  floatingIndicator: {
    position: "absolute",
    bottom: -26,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  indicatorWrapper: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorHalo: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
  },
  indicatorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

export default PermissionCoachmark;
