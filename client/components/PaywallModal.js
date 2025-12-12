// components/PaywallModal.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/colors";
import { useRevenueCat } from "../RevenueCatContext";
import LogoLoader from "./LogoLoader";
import AlertModal from "./AlertModal";

const TOP_PADDING_RATIO = 0.1; // 10% of screen height for top content padding

const PaywallModal = ({
  visible,
  onClose,
  onSelectPremium,
  onSelectFree,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  const { height } = useWindowDimensions();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { currentOffering, purchasePackage, isPremium, initializing } =
    useRevenueCat();

  const [processingId, setProcessingId] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingPackage, setPendingPackage] = useState(null);

  const handleOpenTerms = onOpenTerms || (() => {});
  const handleOpenPrivacy = onOpenPrivacy || (() => {});

  // ===== Animations (spring open) =====
  useEffect(() => {
    if (visible) {
      // reset values so every time it opens, it animates
      fadeAnim.setValue(0);
      slideAnim.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          damping: 16,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const translateY = useMemo(
    () =>
      slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [height, 0], // slides up from bottom
      }),
    [height, slideAnim]
  );

  // ===== RevenueCat packages =====
  const packages = useMemo(
    () => currentOffering?.availablePackages || currentOffering?.packages || [],
    [currentOffering]
  );

  const monthlyPackage = useMemo(
    () => packages.find((p) => p.identifier === "$rc_monthly"),
    [packages]
  );

  const annualPackage = useMemo(
    () => packages.find((p) => p.identifier === "$rc_annual"),
    [packages]
  );

  useEffect(() => {
    if (visible && isPremium) {
      onSelectPremium?.();
    }
  }, [isPremium, visible, onSelectPremium]);

  const isActionDisabled = initializing || Boolean(processingId);

  const startPurchaseFlow = (pkg) => {
    if (!pkg || isActionDisabled) return;
    setPendingPackage(pkg);
    setConfirmVisible(true);
  };

  const handleConfirmPurchase = async () => {
    if (!pendingPackage) return;
    try {
      setConfirmVisible(false);
      setProcessingId(pendingPackage.identifier);
      await purchasePackage(pendingPackage);
      onSelectPremium?.();
    } catch (error) {
      if (!error?.userCancelled) {
        console.error("Purchase failed", error);
      }
    } finally {
      setProcessingId(null);
      setPendingPackage(null);
    }
  };

  const monthlyPrice =
    monthlyPackage?.product?.priceString ||
    monthlyPackage?.product?.price ||
    "$1.99";

  const annualPrice =
    annualPackage?.product?.priceString ||
    annualPackage?.product?.price ||
    "$19.99";

  const confirmMessage = useMemo(() => {
    if (!pendingPackage?.product) return "";
    const priceString =
      pendingPackage.product.priceString || `${pendingPackage.product.price}`;
    return `A ${priceString} purchase will be charged to your App Store account on confirmation. Your subscription will automatically renew for the same price and billing period until you cancel in your App Store account settings.`;
  }, [pendingPackage]);

  const topPadding = height * TOP_PADDING_RATIO;

  return (
    <Modal animationType="none" transparent visible={visible}>
      {processingId && <LogoLoader />}

      <View style={styles.backdrop}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        <BlurView intensity={40} tint="dark" style={styles.blur}>
          {/* Full-screen sheet */}
          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [{ translateY }],
              },
            ]}
            pointerEvents={visible ? "auto" : "none"}
          >
            <LinearGradient
              colors={["#020617", "#020617", "#020617"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.card,
                {
                  paddingTop: topPadding, // ~10% of screen height
                },
              ]}
            >
              {/* Close button - top-right, down ~10% */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={[styles.closeButton, { top: "7%" }]}
              >
                <View style={styles.closeCircle}>
                  <Text style={styles.closeIcon}>✕</Text>
                </View>
              </TouchableOpacity>

              {/* SECTION 1: Top content */}
              <View style={styles.sectionTop}>
                <View style={styles.chipRow}>
                  <View style={styles.chip}>
                    <MaterialCommunityIcons
                      name="crown-outline"
                      size={16}
                      color={COLORS.accent}
                      style={styles.chipIcon}
                    />
                    <Text style={styles.chipText}>Premium</Text>
                  </View>
                </View>

                <Image
                  source={require("../assets/icon.png")}
                  style={styles.logo}
                />

                <Text style={styles.heading}>Unlock the full experience</Text>

                <Text style={styles.subheading}>
                  Premium keeps SoberOwl available and removes ads so you can
                  stay focused on your sobriety.
                </Text>
              </View>

              {/* SECTION 2: Middle content (bullets) */}
              <View style={styles.sectionMiddle}>
                <View className="bulletRow" style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.benefitText}>
                    Unlimited conversations with SoberOwl.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.benefitText}>
                    No ads disrupting your experience.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.benefitText}>
                    Early access to upcoming sober tools.
                  </Text>
                </View>
              </View>

              {/* SECTION 3: Bottom actions */}
              <View style={styles.sectionBottom}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    (!monthlyPackage || isActionDisabled) &&
                      styles.disabledButton,
                  ]}
                  onPress={() => startPurchaseFlow(monthlyPackage)}
                  disabled={!monthlyPackage || isActionDisabled}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>
                    Go Premium — {monthlyPrice}/month
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.secondaryButton,
                    (!annualPackage || isActionDisabled) &&
                      styles.disabledButton,
                  ]}
                  onPress={() => startPurchaseFlow(annualPackage)}
                  disabled={!annualPackage || isActionDisabled}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryButtonText}>
                    Save with yearly — {annualPrice}/year
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.tertiaryButton]}
                  onPress={onSelectFree}
                  disabled={isActionDisabled}
                  activeOpacity={0.85}
                >
                  <Text style={styles.tertiaryText}>
                    Continue free (ads + no SoberOwl)
                  </Text>
                </TouchableOpacity>

                <Text style={styles.termsText}>
                  Subscriptions are billed to your App Store account and renew
                  automatically until cancelled in App Store settings.{" "}
                  <Text style={styles.link} onPress={handleOpenTerms}>
                    Terms
                  </Text>{" "}
                  ·{" "}
                  <Text style={styles.link} onPress={handleOpenPrivacy}>
                    Privacy
                  </Text>
                </Text>

                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Text style={styles.dismissText}>Maybe later</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </View>

      {/* Confirmation modal */}
      <AlertModal
        visible={confirmVisible}
        type="info"
        title="Confirm subscription"
        message={confirmMessage}
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={handleConfirmPurchase}
        onCancel={() => {
          setConfirmVisible(false);
          setPendingPackage(null);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    flex: 1, // full-screen
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  card: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 24,
    justifyContent: "space-between", // sections spread nicely
  },

  // Sections
  sectionTop: {
    alignItems: "center",
  },
  sectionMiddle: {
    marginTop: 12,
  },
  sectionBottom: {
    marginTop: 16,
    alignItems: "center",
  },

  // Close button
  closeButton: {
    position: "absolute",
    right: 18,
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  closeIcon: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },

  // Premium chip – old color scheme + crown
  chipRow: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.4)",
    backgroundColor: "rgba(14,165,233,0.15)",
  },
  chipIcon: {
    color: COLORS.accent,
    marginTop: 1,
  },
  chipText: {
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.4,
  },

  logo: {
    width: 72,
    height: 72,
    marginBottom: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginHorizontal: 6,
    marginBottom: 8,
  },

  bulletRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(234,179,8,0.85)", // dark yellow
    marginTop: 8,
  },
  benefitText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16, // increased font size
    lineHeight: 22,
  },

  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
    backgroundColor: "rgba(15,23,42,0.95)",
  },
  tertiaryButton: {
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  disabledButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#020617",
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  tertiaryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },

  termsText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 16,
  },
  link: {
    color: COLORS.textPrimary,
    textDecorationLine: "underline",
  },
  dismissText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 10,
    textDecorationLine: "underline",
  },
});

export default PaywallModal;
