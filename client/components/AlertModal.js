// components/AlertModal.js
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { BlurView } from "expo-blur";
import { LiquidGlassView } from "@callstack/liquid-glass";
import { isIOSLiquidGlassCapable } from "../utils/deviceCapabilities";

const ACCENT = "#F59E0B";

const AlertModal = ({
  visible,
  type = "info", // "error" | "confirm" | "info"
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  const isConfirm = type === "confirm";
  const isError = type === "error";
  const canUseGlass = isIOSLiquidGlassCapable();

  const resolvedTitle =
    title ||
    (isError
      ? "Something went wrong"
      : isConfirm
      ? "Are you sure?"
      : "Heads up");

  const resolvedConfirmLabel =
    typeof confirmLabel === "string" && confirmLabel.trim().length > 0
      ? confirmLabel
      : isConfirm
      ? "Yes"
      : "Close";

  const resolvedCancelLabel =
    typeof cancelLabel === "string" && cancelLabel.trim().length > 0
      ? cancelLabel
      : "Close";

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else if (onConfirm) {
      onConfirm();
    }
  };

  const Card = canUseGlass ? LiquidGlassView : View;

  const cardProps = canUseGlass
    ? {
        interactive: true,
        effect: "clear",
        tintColor: "rgba(255,255,255,0.25)",
        colorScheme: "system",
        style: styles.modalContentGlass,
      }
    : {
        style: styles.modalContentFallback,
      };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <BlurView
          intensity={canUseGlass ? 42 : 30}
          tint="dark"
          style={styles.blurBackground}
        >
          <View style={styles.shadowWrapper}>
            <Card {...cardProps}>
              <Image
                source={require("../assets/icon.png")}
                style={styles.modalLogo}
              />

              {resolvedTitle ? (
                <Text
                  style={[
                    styles.modalTitle,
                    !canUseGlass && styles.modalTitleFallback,
                  ]}
                >
                  {resolvedTitle}
                </Text>
              ) : null}

              {message ? (
                <Text
                  style={[
                    styles.modalMessage,
                    !canUseGlass && styles.modalMessageFallback,
                  ]}
                >
                  {message}
                </Text>
              ) : null}

              {isConfirm ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      canUseGlass
                        ? styles.secondaryButtonGlass
                        : styles.secondaryButtonFallback,
                    ]}
                    onPress={onCancel || handleClose}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.secondaryText,
                        !canUseGlass && styles.secondaryTextFallback,
                      ]}
                    >
                      {resolvedCancelLabel}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      canUseGlass
                        ? styles.primaryButtonGlass
                        : styles.primaryButtonFallback,
                    ]}
                    onPress={onConfirm || handleClose}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.primaryText,
                        !canUseGlass && styles.primaryTextFallback,
                      ]}
                    >
                      {resolvedConfirmLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={onConfirm || handleClose}
                  activeOpacity={0.9}
                  style={[
                    styles.singlePrimaryButton,
                    canUseGlass
                      ? styles.primaryButtonGlass
                      : styles.primaryButtonFallback,
                  ]}
                >
                  <Text
                    style={[
                      styles.singlePrimaryText,
                      !canUseGlass && styles.singlePrimaryTextFallback,
                    ]}
                  >
                    {resolvedConfirmLabel}
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  shadowWrapper: {
    width: "80%",
    maxWidth: 380,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    elevation: 14,
  },

  // 🧊 Liquid Glass card
  modalContentGlass: {
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    overflow: "hidden",
  },

  // 🧱 Fallback card (non-glass, high contrast)
  modalContentFallback: {
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  modalLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 18,
  },

  // Titles
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F9FAFB", // glass default (on dark background)
    textAlign: "center",
    marginBottom: 6,
  },
  modalTitleFallback: {
    color: "#0F172A", // much darker for non-glass
  },

  // Messages
  modalMessage: {
    fontSize: 14,
    color: "#E5E7EB", // glass default
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalMessageFallback: {
    color: "#111827", // darker & easier to read on white
  },

  buttonRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  // Secondary buttons
  secondaryButtonGlass: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(249,250,251,0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  secondaryButtonFallback: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },

  // Primary buttons (shared base color)
  primaryButtonGlass: {
    backgroundColor: ACCENT,
  },
  primaryButtonFallback: {
    backgroundColor: ACCENT,
  },

  singlePrimaryButton: {
    borderRadius: 999,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 4,
  },

  // Text styles
  primaryText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  primaryTextFallback: {
    color: "#111827", // same but kept explicit for clarity
  },

  secondaryText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryTextFallback: {
    color: "#111827", // darker on light background
  },

  singlePrimaryText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  singlePrimaryTextFallback: {
    color: "#111827",
  },
});

export default AlertModal;
