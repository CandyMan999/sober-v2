import React, { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { useClient } from "../../client";
import Context from "../../context";
import { UPDATE_USER_PROFILE_MUTATION } from "../../GraphQL/mutations";
import { getToken } from "../../utils/helpers";

const AddWhyScreen = ({ navigation }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);
  const currentWhy = state?.user?.whyStatement || "";
  const [text, setText] = useState(currentWhy);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = text.trim();
  const ready = trimmed.length >= 8;

  const vibe = useMemo(() => {
    if (trimmed.length > 180) return "Keep it concise so future you can recall it fast.";
    if (trimmed.length > 120) return "Powerful. This will anchor you on tough days.";
    if (trimmed.length > 60) return "Great clarity — a few more words if you need.";
    if (trimmed.length > 0) return "Center on what keeps you grounded.";
    return "Write a short statement about why sobriety matters to you.";
  }, [trimmed]);

  const handleSubmit = async () => {
    if (!ready || submitting) return;
    try {
      setSubmitting(true);
      Keyboard.dismiss();
      const token = await getToken();
      await client.request(UPDATE_USER_PROFILE_MUTATION, {
        token,
        whyStatement: trimmed,
      });

      dispatch({
        type: "SET_USER",
        payload: { ...(state.user || {}), whyStatement: trimmed },
      });

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
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation?.goBack?.()}
              accessibilityLabel="Back to profile"
            >
              <Feather name="arrow-left" size={20} color="#e5e7eb" />
              <Text style={styles.backLabel}>Profile</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Your Why</Text>
          </View>

          <Text style={styles.subtitle}>
            Drop a simple reminder to keep you focused. This shows on your profile.
          </Text>

          <View style={styles.previewCard}>
            <MaterialCommunityIcons name="format-quote-close" size={20} color="#f59e0b" />
            <Text style={styles.previewText}>
              {trimmed.length ? `“${trimmed}”` : "“Share the reason you're choosing sobriety.”"}
            </Text>
            <Text style={styles.helper}>{vibe}</Text>
          </View>

          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="Write a short statement about why you're here..."
              placeholderTextColor="#9ca3af"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={240}
              textAlignVertical="top"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <View style={styles.footerRow}>
              <Text style={styles.counter}>{`${trimmed.length}/240`}</Text>
              <TouchableOpacity
                style={[styles.saveButton, !ready && styles.saveButtonDisabled]}
                onPress={handleSubmit}
                disabled={!ready || submitting}
              >
                {submitting ? (
                  <Feather name="loader" size={18} color="#0b1220" />
                ) : (
                  <Feather name="check" size={18} color="#0b1220" />
                )}
                <Text style={styles.saveLabel}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050816",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  backLabel: {
    color: "#e5e7eb",
    marginLeft: 6,
    fontWeight: "700",
  },
  title: {
    color: "#e5e7eb",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: 16,
    lineHeight: 20,
  },
  previewCard: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 14,
  },
  previewText: {
    color: "#e5e7eb",
    fontSize: 16,
    lineHeight: 22,
    marginTop: 6,
  },
  helper: {
    color: "#9ca3af",
    marginTop: 10,
    fontSize: 13,
  },
  inputCard: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#111827",
    flex: 1,
  },
  input: {
    color: "#e5e7eb",
    minHeight: 180,
    fontSize: 16,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  counter: {
    color: "#9ca3af",
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f59e0b",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: "#fbbf24",
    opacity: 0.5,
  },
  saveLabel: {
    color: "#0b1220",
    fontWeight: "800",
    marginLeft: 8,
    fontSize: 15,
  },
});

export default AddWhyScreen;
