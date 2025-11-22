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

  // ✅ Make confirm + cancel labels super explicit
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

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <BlurView intensity={30} style={styles.blurBackground}>
          <View style={styles.modalContent}>
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
              // Confirm: Cancel + Confirm buttons
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={onCancel || handleClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryText}>
                    {String(resolvedCancelLabel)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={onConfirm || handleClose}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryText}>
                    {String(resolvedConfirmLabel)}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={onConfirm || handleClose}
                activeOpacity={0.9}
                style={{
                  backgroundColor: ACCENT,
                  borderRadius: 999,
                  height: 50,
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Text
                  style={{ color: "#1A1A1A", fontSize: 16, fontWeight: "700" }}
                >
                  {resolvedConfirmLabel}
                </Text>
              </TouchableOpacity>
            )}
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
  modalContent: {
    width: "80%",
    maxWidth: 380,
    backgroundColor: "white",
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
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
    color: "#111827",
    textAlign: "center",
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 14,
    color: "#4B5563",
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
  singleButton: {
    width: "100%",
    marginTop: 4,
  },
  secondaryButton: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  primaryButton: {
    marginLeft: 0,
    backgroundColor: ACCENT,
  },
  primaryText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default AlertModal;
