import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useClient } from "../../client";
import { ADD_QUOTE_MUTATION } from "../../GraphQL/mutations";

const AddQuoteScreen = ({ navigation }) => {
  const client = useClient();
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = text.trim();
  const ready = trimmed.length >= 12;

  const vibeLine = useMemo(() => {
    if (trimmed.length > 160) return "Keep it crisp. Make every word punch.";
    if (trimmed.length > 80) return "Powerful. You're in storyteller mode.";
    if (trimmed.length > 30) return "Love this energy — keep flowing.";
    if (trimmed.length > 0) return "Short and sweet. Add a little more magic.";
    return "Drop a line that would stop someone mid-scroll.";
  }, [trimmed]);

  const handleSubmit = async () => {
    if (!ready || submitting) return;
    try {
      setSubmitting(true);
      setStatus(null);
      await client.request(ADD_QUOTE_MUTATION, { text: trimmed });
      setStatus("success");
      setText("");
    } catch (err) {
      console.error("Error adding quote", err);
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#060914", "#0b1220", "#050816"]} style={styles.bg}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.goBack()}
              >
                <Feather name="x" size={22} color="#e5e7eb" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={styles.title}>Share a spark</Text>
                <Text style={styles.subtitle}>Write the quote that you wish existed.</Text>
              </View>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.cardShadow}>
              <LinearGradient
                colors={["#0f172a", "#111827", "#0b1220"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewCard}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.pill}>
                    <MaterialCommunityIcons name="lightning-bolt" size={16} color="#f59e0b" />
                    <Text style={styles.pillText}>Quote Preview</Text>
                  </View>
                  <Text style={styles.handle}>@You</Text>
                </View>
                <Text style={styles.previewText} numberOfLines={5}>
                  {trimmed || "“The comeback is always louder than the setback.”"}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Feather name="activity" size={14} color="#fbbf24" />
                    <Text style={styles.metaText}>{vibeLine}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.inputShell}>
              <Text style={styles.label}>Your quote</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Type something unforgettable..."
                  placeholderTextColor="#6b7280"
                  multiline
                  textAlignVertical="top"
                  style={styles.input}
                  maxLength={240}
                />
                <Text style={styles.counter}>{`${trimmed.length}/240`}</Text>
              </View>
              <Text style={styles.helper}>{vibeLine}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cta, !ready && styles.ctaDisabled]}
                activeOpacity={ready ? 0.9 : 1}
                onPress={handleSubmit}
                disabled={!ready || submitting}
              >
                <LinearGradient
                  colors={ready ? ["#f59e0b", "#fbbf24"] : ["#1f2937", "#111827"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaInner}
                >
                  {submitting ? (
                    <ActivityIndicator color="#0b1220" />
                  ) : (
                    <Text style={styles.ctaText}>Submit for review</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              {status === "success" && (
                <Text style={styles.statusSuccess}>
                  Sent for approval. We'll notify you when it's live.
                </Text>
              )}
              {status === "error" && (
                <Text style={styles.statusError}>
                  Couldn't send your quote. Please try again.
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  scroll: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: {
    fontSize: 20,
    color: "#f9fafb",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "#9ca3af",
    marginTop: 4,
    fontSize: 13,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    borderRadius: 18,
  },
  previewCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245,158,11,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 8,
  },
  pillText: {
    color: "#fbbf24",
    fontWeight: "700",
    fontSize: 12,
  },
  handle: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  previewText: {
    color: "#f9fafb",
    fontSize: 22,
    lineHeight: 30,
    marginBottom: 16,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  metaText: {
    color: "#d1d5db",
    fontSize: 12,
    flexShrink: 1,
  },
  inputShell: {
    marginTop: 22,
    gap: 8,
  },
  label: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "700",
  },
  inputWrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    minHeight: 140,
  },
  input: {
    color: "#f9fafb",
    fontSize: 16,
    lineHeight: 24,
  },
  counter: {
    color: "#9ca3af",
    textAlign: "right",
    marginTop: 8,
    fontSize: 12,
  },
  helper: {
    color: "#a5b4fc",
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    marginTop: 26,
    gap: 10,
  },
  cta: {
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaInner: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#0b1220",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  statusSuccess: {
    color: "#34d399",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  statusError: {
    color: "#f87171",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
});

export default AddQuoteScreen;
