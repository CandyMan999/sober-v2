import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  ScrollView,
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
    participants = [],
  },
  ref
) => {
  const canSend = value?.trim()?.length > 0 && !disabled;
  const replyUsername = replyTarget?.author?.username;
  const inputRef = useRef(null);
  const [mentionQuery, setMentionQuery] = useState(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus?.(),
    blur: () => inputRef.current?.blur?.(),
  }));

  useEffect(() => {
    const match = value?.match(/(^|\s)@([^@\s]*)$/);
    if (match) {
      setMentionQuery(match[2] || "");
    } else {
      setMentionQuery(null);
    }
  }, [value]);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];

    const query = mentionQuery.toLowerCase();
    const uniqueUsers = new Map();

    participants.forEach((user) => {
      if (!user?.username) return;
      if (user.id && currentUser?.id && user.id === currentUser.id) return;
      const key = user.username.toLowerCase();
      if (uniqueUsers.has(key)) return;
      uniqueUsers.set(key, user);
    });

    return Array.from(uniqueUsers.values()).filter((user) => {
      if (!query) return true;
      return user.username.toLowerCase().includes(query);
    });
  }, [mentionQuery, participants, currentUser?.id]);

  const handleSelectMention = (username) => {
    if (!username || !onChangeText) return;
    const next = value?.replace(/@[^@\s]*$/, `@${username} `) || `@${username} `;
    onChangeText(next);
    requestAnimationFrame(() => inputRef.current?.focus?.());
  };

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
            <View style={styles.replyingIndicator} />
            <View style={styles.replyingCopy}>
              <Text style={styles.replyingLabel} numberOfLines={1}>
                Reply to <Text style={styles.replyingName}>{replyUsername}</Text>
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
        {mentionSuggestions.length ? (
          <View style={styles.mentionBanner}>
            <Text style={styles.mentionLabel}>Mention someone</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mentionList}
            >
              {mentionSuggestions.map((user) => (
                <TouchableOpacity
                  key={`mention-${user.id || user.username}`}
                  style={styles.mentionChip}
                  onPress={() => handleSelectMention(user.username)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mention ${user.username}`}
                >
                  <Text style={styles.mentionText}>@{user.username}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(10,16,26,0.92)",
    gap: 10,
  },
  replyingIndicator: {
    width: 3,
    height: "100%",
    alignSelf: "stretch",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  replyingCopy: {
    flex: 1,
    gap: 2,
  },
  replyingLabel: {
    color: "#e5e7eb",
    fontWeight: "600",
    fontSize: 11,
  },
  replyingName: {
    color: "#fef3c7",
  },
  replyingPreview: {
    color: "#cbd5e1",
    fontSize: 10,
  },
  closeReply: {
    padding: 6,
    borderRadius: 999,
  },
  mentionBanner: {
    backgroundColor: "rgba(15,23,42,0.92)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  mentionLabel: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "600",
  },
  mentionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mentionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(56,189,248,0.12)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
  },
  mentionText: {
    color: "#bae6fd",
    fontWeight: "700",
    fontSize: 12,
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
