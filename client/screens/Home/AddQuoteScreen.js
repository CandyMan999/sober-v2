// screens/Sober/AddQuoteScreen.js
import React, { useMemo, useState, useContext } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ToastAndroid,
  Image,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { useClient } from "../../client";
import { ADD_QUOTE_MUTATION } from "../../GraphQL/mutations";
import Context from "../../context";

const ACCENT = "#F59E0B";

const AddQuoteScreen = ({ navigation }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);
  const user = state?.user;

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = text.trim();
  const ready = trimmed.length >= 12;

  const vibeLine = useMemo(() => {
    if (trimmed.length > 160) return "Keep it crisp. Make every word punch.";
    if (trimmed.length > 80) return "Powerful. You're in storyteller mode.";
    if (trimmed.length > 30) return "Love this energy — keep flowing.";
    if (trimmed.length > 0) return "Short and sweet. Add a little more magic.";
    return "Write something future-you would have needed to hear.";
  }, [trimmed]);

  const previewText =
    trimmed || "“The comeback is always louder than the setback.”";

  const handleSubmit = async () => {
    if (!ready || submitting) return;
    try {
      setSubmitting(true);
      Keyboard.dismiss(); // close keyboard on send
      const data = await client.request(ADD_QUOTE_MUTATION, { text: trimmed });
      const newQuote = data?.addQuote;

      Toast.show({
        type: "success",
        text1: "Quote submitted 🎉",
        text2: "We'll notify you if it's approved.",
        position: "top",
        autoHide: true,
        visibilityTime: 6000,
        topOffset: 80,
      });

      if (newQuote) {
        dispatch({ type: "APPEND_PROFILE_QUOTE", payload: newQuote });
      }

      setText("");
      navigation.goBack();
    } catch (err) {
      console.error("Error adding quote", err);
      const message =
        err?.response?.errors?.[0]?.message ||
        err?.message ||
        "Check your connection and try again.";

      Toast.show({
        type: "error",
        text1: "Submission failed",
        text2: message,
        position: "top",
        autoHide: true,
        visibilityTime: 6000,
        topOffset: 80,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const avatarUrl = user?.profilePicUrl || null;
  const username =
    user?.username && user.username.trim().length > 0
      ? `@${user.username}`
      : "@you";

  const firstInitial = user?.username?.[0]?.toUpperCase() || "U";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="format-quote-close"
                size={20}
                color="#4b5563"
              />
              <Text style={styles.headerTitle}>New quote</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Feather name="x" size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {/* Subheading */}
          <Text style={styles.subheading}>
            Your words might hit someone right when they need it most.
          </Text>

          {/* Preview card */}
          <View style={styles.previewCard}>
            <View style={styles.previewTopRow}>
              <View style={styles.previewAvatarRow}>
                <View style={styles.previewAvatarHalo}>
                  <View style={styles.previewAvatarOuter}>
                    {avatarUrl ? (
                      <Image
                        source={{ uri: avatarUrl }}
                        style={styles.previewAvatarImage}
                      />
                    ) : (
                      <Text style={styles.previewAvatarInitial}>
                        {firstInitial}
                      </Text>
                    )}
                  </View>
                </View>

                <View>
                  <Text style={styles.previewHandle}>{username}</Text>
                  <Text style={styles.previewMeta}>Sober Motivation</Text>
                </View>
              </View>
            </View>

            <Text style={styles.previewQuote}>{previewText}</Text>

            <Text style={styles.previewHelper}>{vibeLine}</Text>
          </View>

          {/* Bottom composer (TikTok-style) */}
          <View style={styles.composerContainer}>
            {/* Avatar */}
            <View style={styles.avatarHalo}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarInitial}>{firstInitial}</Text>
                )}
              </View>
            </View>

            {/* Input bubble */}
            <View style={styles.inputBubble}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Write a quote that could stop someone mid-scroll..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={240}
                style={styles.input}
                textAlignVertical="top"
                blurOnSubmit={true}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <View style={styles.bubbleFooter}>
                <Text style={styles.counter}>{`${trimmed.length}/240`}</Text>
              </View>
            </View>

            {/* Send button */}
            <TouchableOpacity
              style={[
                styles.sendButtonWrapper,
                (!ready || submitting) && styles.sendButtonDisabled,
              ]}
              activeOpacity={ready && !submitting ? 0.9 : 1}
              onPress={handleSubmit}
              disabled={!ready || submitting}
            >
              <View style={styles.sendButton}>
                {submitting ? (
                  <ActivityIndicator color="#111827" size="small" />
                ) : (
                  <Feather name="send" size={18} color="#111827" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerHint}>
            Approved quotes may be featured in push notifications for the entire
            community.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  subheading: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 14,
  },
  previewCard: {
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  previewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  previewAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewAvatarHalo: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  previewAvatarOuter: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ACCENT,
    overflow: "hidden",
  },
  previewAvatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  previewAvatarInitial: {
    color: "#fbbf24",
    fontSize: 18,
    fontWeight: "800",
  },
  previewHandle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  previewMeta: {
    fontSize: 12,
    color: "#6b7280",
  },
  previewQuote: {
    marginTop: 8,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#111827",
  },
  previewHelper: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
  },
  composerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: "auto", // 👈 pins composer to bottom visually
    paddingBottom: 12,
  },
  avatarHalo: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ACCENT,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarInitial: {
    color: "#fbbf24",
    fontSize: 20,
    fontWeight: "800",
  },
  inputBubble: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
    marginRight: 8,
  },
  input: {
    fontSize: 15,
    color: "#111827",
    maxHeight: 120,
  },
  bubbleFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  counter: {
    fontSize: 11,
    color: "#9ca3af",
  },
  sendButtonWrapper: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  footerHint: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 8,
  },
});

export default AddQuoteScreen;
