import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/colors";

const PaywallModal = ({ visible, onClose, onSelectPremium, onSelectFree }) => {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <BlurView intensity={45} tint="dark" style={styles.blur}>
          <View style={styles.cardWrapper}>
            <LinearGradient
              colors={["#0f172a", "#111827", "#0b1120"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
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
            </LinearGradient>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  cardWrapper: {
    width: "86%",
    maxWidth: 420,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  card: {
    paddingHorizontal: 22,
    paddingVertical: 24,
    borderRadius: 28,
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  subheading: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
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
    paddingVertical: 14,
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
    marginTop: 4,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});

export default PaywallModal;
