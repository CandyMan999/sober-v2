import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Avatar from "../../../components/Avatar";

const MessageInput = ({
  value,
  onChangeText,
  onSend,
  disabled,
  currentUser,
  bottomInset = 0,
}) => {
  const canSend = value?.trim()?.length > 0 && !disabled;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(12, bottomInset) }]}>
      <Avatar
        uri={currentUser?.profilePicUrl}
        size={34}
        style={styles.avatar}
        fallbackText={currentUser?.username}
      />
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Share encouragement..."
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={!canSend}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Ionicons name="send" size={20} color="#f59e0b" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  avatar: {
    marginBottom: 6,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: "#fef3c7",
    fontSize: 14,
    maxHeight: 120,
    paddingRight: 8,
  },
  sendButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

export default MessageInput;
