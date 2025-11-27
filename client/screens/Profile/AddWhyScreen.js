import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { useClient } from "../../client";
import Context from "../../context";
import { UPDATE_USER_PROFILE_MUTATION } from "../../GraphQL/mutations";
import { getToken } from "../../utils/helpers";

const ACCENT = "#F59E0B";
const BG = "#050816";
const CARD_BG = "#0b1220";

const AddWhyScreen = ({ navigation }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);
  const user = state?.user;

  const currentWhy = user?.whyStatement || "";
  const [text, setText] = useState(currentWhy);
  const [submitting, setSubmitting] = useState(false);

  const hasExisting = currentWhy.trim().length > 0;

  const trimmed = text.trim();
  const ready = trimmed.length >= 8;

  const vibeLine = useMemo(() => {
    if (trimmed.length > 180) return "Keep it concise so future you can recall it fast.";
    if (trimmed.length > 120) return "Powerful. This will anchor you on tough days.";
    if (trimmed.length > 60) return "Great clarity — a few more words if you need.";
    if (trimmed.length > 0) return "Center on what keeps you grounded.";
    return "Write a short statement about why sobriety matters to you.";
  }, [trimmed]);

  const previewText =
    trimmed || "“Share the reason you're choosing sobriety. Future you will thank you.”";

  const avatarUrl = user?.profilePicUrl || null;
  const username =
    user?.username && user.username.trim().length > 0 ? `@${user.username}` : "@you";
  const firstInitial = user?.username?.[0]?.toUpperCase() || "U";

  const handleSubmit = async () => {
    if (!ready || submitting) return;
    try {
      setSubmitting(true);
      Keyboard.dismiss();

      const token = await getToken();
      const data = await client.request(UPDATE_USER_PROFILE_MUTATION, {
        token,
        whyStatement: trimmed,
      });

      const updatedUser = data?.updateUserProfile || { ...(user || {}), whyStatement: trimmed };

      dispatch({ type: "SET_USER", payload: updatedUser });

      if (state.profileOverview) {
        dispatch({
          type: "SET_PROFILE_OVERVIEW",
          payload: {
            ...state.profileOverview,
            user: { ...state.profileOverview.user, ...updatedUser },
          },
        });
      }

      Toast.show({
        type: "success",
        text1: "Why saved",
        text2: "Your profile has been updated.",
        position: "top",
        autoHide: true,
        visibilityTime: 5000,
        topOffset: 80,
      });

      navigation.goBack();
    } catch (err) {
      console.error("Error saving why statement", err);
      Toast.show({
        type: "error",
        text1: "Couldn't save",
        text2: "Please check your connection and try again.",
        position: "top",
        autoHide: true,
        visibilityTime: 5000,
        topOffset: 80,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons
                name="format-quote-close"
                size={20}
                color="#d1d5db"
              />
              <Text style={styles.headerTitle}>Add your why</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Feather name="x" size={20} color="#d1d5db" />
            </TouchableOpacity>
          </View>

          {/* Subheading */}
          <Text style={styles.subheading}>
            Lock in the reminder that keeps you focused when sobriety gets tested.
          </Text>

          {/* Preview card */}
          <View style={styles.previewCard}>
            <View style={styles.previewTopRow}>
              <View style={styles.previewAvatarRow}>
                <View style={styles.previewAvatarHalo}>
                  <View style={styles.previewAvatarOuter}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.previewAvatarImage} />
                    ) : (
                      <Text style={styles.previewAvatarInitial}>{firstInitial}</Text>
                    )}
                  </View>
                </View>

                <View>
                  <Text style={styles.previewHandle}>{username}</Text>
                  <Text style={styles.previewMeta}>Why statement</Text>
                </View>
              </View>
            </View>

            <Text style={styles.previewQuote}>{previewText}</Text>

            <Text style={styles.previewHelper}>{vibeLine}</Text>
          </View>

          {/* Bottom composer */}
          <View style={styles.composerContainer}>
            <View style={styles.avatarHalo}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>{firstInitial}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputBubble}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Write a short statement about why you're here..."
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

            <TouchableOpacity
              style={[
                styles.sendButtonWrapper,
                hasExisting && styles.changeButtonWrapper,
                (!ready || submitting) && styles.sendButtonDisabled,
              ]}
              activeOpacity={ready && !submitting ? 0.9 : 1}
              onPress={handleSubmit}
              disabled={!ready || submitting}
            >
              <View style={[styles.sendButton, hasExisting && styles.changeButton]}>
                {submitting ? (
                  <ActivityIndicator color={hasExisting ? "#0ea5e9" : "#0b1220"} size="small" />
                ) : hasExisting ? (
                  <>
                    <Feather name="refresh-cw" size={16} color="#0ea5e9" />
                    <Text style={styles.changeLabel}>Change</Text>
                  </>
                ) : (
                  <Feather name="send" size={18} color="#0b1220" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerHint}>
            Your why appears on your profile and helps buddies understand your journey.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
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
    color: "#e5e7eb",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  subheading: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 14,
  },
  previewCard: {
    borderRadius: 18,
    backgroundColor: CARD_BG,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#111827",
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
    backgroundColor: "rgba(245,158,11,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  previewAvatarOuter: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#0f172a",
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
    color: "#e5e7eb",
  },
  previewMeta: {
    fontSize: 12,
    color: "#9ca3af",
  },
  previewQuote: {
    marginTop: 8,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#f9fafb",
  },
  previewHelper: {
    marginTop: 8,
    fontSize: 12,
    color: "#9ca3af",
  },
  composerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: "auto",
    paddingBottom: 12,
  },
  avatarHalo: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#0f172a",
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
    borderColor: "#1f2937",
    backgroundColor: CARD_BG,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
    marginRight: 8,
  },
  input: {
    fontSize: 15,
    color: "#e5e7eb",
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
    minWidth: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  changeButtonWrapper: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#0ea5e9",
    width: 98,
  },
  changeButton: {
    backgroundColor: "rgba(14,165,233,0.12)",
    paddingHorizontal: 10,
    justifyContent: "space-evenly",
  },
  changeLabel: {
    color: "#0ea5e9",
    fontSize: 14,
    fontWeight: "700",
  },
  footerHint: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 8,
  },
});

export default AddWhyScreen;
