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
    if (onCancel) onCancel();
    else if (onConfirm) onConfirm();
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Soft backdrop blur */}
        <BlurView intensity={42} tint="dark" style={styles.blurBackground}>
          {/* Shadow wrapper */}
          <View style={styles.shadowWrapper}>
            <LiquidGlassView
              interactive
              effect="clear"
              tintColor="rgba(255,255,255,0.25)"
              colorScheme="system"
              style={styles.modalContent}
            >
              <Image
                source={require("../assets/icon.png")}
                style={styles.modalLogo}
              />

              {resolvedTitle ? (
                <Text style={styles.modalTitle}>{resolvedTitle}</Text>
              ) : null}

              {message ? (
                <Text style={styles.modalMessage}>{message}</Text>
              ) : null}

              {isConfirm ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={onCancel || handleClose}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.secondaryText}>
                      {resolvedCancelLabel}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={onConfirm || handleClose}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.primaryText}>
                      {resolvedConfirmLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={onConfirm || handleClose}
                  activeOpacity={0.9}
                  style={styles.singlePrimaryButton}
                >
                  <Text style={styles.singlePrimaryText}>
                    {resolvedConfirmLabel}
                  </Text>
                </TouchableOpacity>
              )}
            </LiquidGlassView>
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
  modalContent: {
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    overflow: "hidden",
  },
  modalLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F9FAFB",
    textAlign: "center",
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 14,
    color: "#E5E7EB",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
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
  secondaryButton: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(249,250,251,0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  primaryButton: {
    backgroundColor: ACCENT,
  },
  singlePrimaryButton: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 4,
  },
  primaryText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "500",
  },
  singlePrimaryText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default AlertModal;
