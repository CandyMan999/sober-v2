import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * 0.4);

const FALLBACK_COMMENTS = [
  {
    id: "placeholder-1",
    author: { name: "Skylar" },
    text: "Love the energy in this clip.",
  },
  {
    id: "placeholder-2",
    author: { name: "Cameron" },
    text: "Can we get more behind-the-scenes?",
  },
  {
    id: "placeholder-3",
    author: { name: "Jordan" },
    text: "Cheering you on—this is inspiring!",
  },
];

const CommentSheet = ({ visible, onClose, comments = [] }) => {
  const [mounted, setMounted] = useState(visible);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(sheetAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 16,
        stiffness: 180,
        mass: 0.9,
      }).start();
    } else {
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 16,
        stiffness: 180,
        mass: 0.9,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
        }
      });
    }
  }, [sheetAnim, visible]);

  const translateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT + 60, 0],
  });

  const renderComments = comments.length ? comments : FALLBACK_COMMENTS;

  if (!mounted) return null;

  return (
    <Modal
      animationType="none"
      transparent
      visible={mounted}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Comments</Text>
              <Text style={styles.sheetSubtitle}>
                Share encouragement or ask a question.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close comments"
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close" size={22} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {renderComments.map((comment, idx) => (
              <View
                key={comment.id || idx}
                style={[styles.commentRow, idx !== renderComments.length - 1 && styles.commentDivider]}
              >
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={16} color="#fef3c7" />
                </View>
                <View style={styles.commentBody}>
                  <Text style={styles.commentAuthor}>
                    {comment?.author?.name || "Anonymous"}
                  </Text>
                  <Text style={styles.commentText}>
                    {comment?.text || comment?.body || "Thanks for sharing!"}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
              <Ionicons name="bookmark-outline" size={18} color="#fef3c7" />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
              <Ionicons
                name="share-social-outline"
                size={18}
                color="#fef3c7"
              />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => {}}>
            <Text style={styles.primaryButtonText}>
              Add a comment (coming soon)
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sheetSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
  },
  commentsList: {
    flex: 1,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  commentDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148,163,184,0.35)",
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(245,158,11,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
  },
  commentBody: {
    flex: 1,
  },
  commentAuthor: {
    color: "#fef3c7",
    fontWeight: "700",
    marginBottom: 4,
    fontSize: 14,
  },
  commentText: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    backgroundColor: "rgba(30,41,59,0.85)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
  },
  actionButtonText: {
    color: "#fef3c7",
    fontWeight: "700",
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#0ea5e9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryButtonText: {
    color: "#0b1224",
    fontWeight: "800",
    fontSize: 15,
  },
});

export default CommentSheet;
