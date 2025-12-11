import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/colors";

const TERMS_OF_SERVICE_URL = "https://example.com/terms";

const PaywallModal = ({ visible, onClose, onSelectPremium, onSelectFree }) => {
  const { height } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 200,
          mass: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, slideAnim, visible]);

  const translateY = useMemo(
    () =>
      slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [height, 0],
      }),
    [height, slideAnim]
  );

  const handleOpenTerms = () => {
    Linking.openURL(TERMS_OF_SERVICE_URL).catch(() => {});
  };

  return (
    <Modal animationType="none" transparent visible={visible}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.backdropOverlay, { opacity: fadeAnim }]} />
        <BlurView intensity={40} tint="dark" style={styles.blur}>
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
            pointerEvents={visible ? "auto" : "none"}
          >
            <LinearGradient
              colors={["#0f172a", "#111827", "#0b1120"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <View style={styles.pill}>
                <Text style={styles.pillText}>Premium</Text>
              </View>
              <Image
                source={require("../assets/icon.png")}
                style={styles.logo}
              />
              <Text style={styles.heading}>Stay Premium with Owl</Text>
              <Text style={styles.subheading}>
                I hope you are enjoying the app, your 2 months free ride is coming
                to an end.
              </Text>
              <View style={styles.benefits}>
                <View style={styles.benefitRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.benefitText}>
                    Keep chatting with Owl, your sobriety coach/therapist.
                  </Text>
                </View>
                <View style={styles.benefitRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.benefitText}>Remove ads across the app.</Text>
                </View>
                <View style={styles.benefitRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.benefitText}>
                    Priority access to future premium tools.
                  </Text>
                </View>
              </View>
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  If you don&apos;t pay the $1.99/month premium, you&apos;ll lose access to
                  Owl and start seeing ads.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                activeOpacity={0.9}
                onPress={onSelectPremium}
              >
                <Text style={styles.primaryButtonText}>Go Premium — $1.99/mo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                activeOpacity={0.85}
                onPress={onSelectFree}
              >
                <Text style={styles.secondaryButtonText}>
                  Continue with ads (free)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.dismissText}>Maybe later</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenTerms} activeOpacity={0.7}>
                <Text style={styles.termsLink}>Terms of Service</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    alignItems: "center",
    gap: 16,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 6,
  },
  pill: {
    backgroundColor: "rgba(14,165,233,0.15)",
    borderColor: "rgba(14,165,233,0.4)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  subheading: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 23,
  },
  benefits: {
    width: "100%",
    gap: 8,
    marginTop: 6,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: COLORS.accent,
  },
  benefitText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  noticeBox: {
    width: "100%",
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.4)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  noticeText: {
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonText: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  dismissText: {
    color: COLORS.textSecondary,
    marginTop: 6,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  termsLink: {
    color: COLORS.textPrimary,
    marginTop: 8,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});

export default PaywallModal;
