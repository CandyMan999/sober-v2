import React, { forwardRef, useImperativeHandle, useRef } from "react";
import {
  Keyboard,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Avatar from "../../../components/Avatar";

const MessageInput = (
  {
    value,
    onChangeText,
    onSend,
    disabled,
    currentUser,
    bottomInset = 0,
    replyTarget,
    onCancelReply,
  },
  ref
) => {
  const canSend = value?.trim()?.length > 0 && !disabled;
  const replyUsername = replyTarget?.author?.username;
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus?.(),
    blur: () => inputRef.current?.blur?.(),
  }));

  return (
    <View
      style={[styles.container, { paddingBottom: bottomInset }]}
    >
      <Avatar
        uri={currentUser?.profilePicUrl}
        haloColor="blue"
        size={32}
        style={styles.avatar}
        fallbackText={currentUser?.username}
      />
      <View style={styles.composerColumn}>
        {replyTarget ? (
          <View style={styles.replyingTo}>
            <View style={styles.replyingCopy}>
              <Text style={styles.replyingLabel} numberOfLines={1}>
                Replying to <Text style={styles.replyingName}>@{replyUsername}</Text>
              </Text>
              <Text style={styles.replyingPreview} numberOfLines={1}>
                {replyTarget?.text || "Message"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCancelReply}
              style={styles.closeReply}
              accessibilityRole="button"
              accessibilityLabel="Cancel reply"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={16} color="#e2e8f0" />
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Share encouragement..."
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={onChangeText}
            maxLength={500}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={() => Keyboard.dismiss()}
            ref={inputRef}
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={!canSend}
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Ionicons
              name="send"
              size={17}
              color={canSend ? "#38bdf8" : "#64748b"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  composerColumn: {
    flex: 1,
    gap: 6,
  },
  avatar: {
    marginBottom: 2,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 46,
  },
  replyingTo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
    backgroundColor: "rgba(59,130,246,0.1)",
    gap: 8,
  },
  replyingCopy: {
    flex: 1,
    gap: 2,
  },
  replyingLabel: {
    color: "#bfdbfe",
    fontWeight: "700",
    fontSize: 11,
  },
  replyingName: {
    color: "#f59e0b",
  },
  replyingPreview: {
    color: "#cbd5e1",
    fontSize: 11,
  },
  closeReply: {
    backgroundColor: "rgba(248,250,252,0.1)",
    padding: 6,
    borderRadius: 999,
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

export default forwardRef(MessageInput);
