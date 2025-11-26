import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * 0.75);
const EMOJI_ROW = ["❤️", "😍", "🔥", "👏", "😮", "🙏", "👍", "😢", "😂", "🎉"];

const FALLBACK_COMMENTS = [
  {
    id: "placeholder-1",
    author: { name: "northfreshfarm" },
    text: "My solution is simple: I made a grow kit...",
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    likesCount: 83,
    replies: [
      {
        id: "placeholder-1-1",
        author: { name: "ueno_tp" },
        text: "Oh, he's selling something OK, new here!",
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        likesCount: 4,
      },
    ],
  },
  {
    id: "placeholder-2",
    author: { name: "ron.marko" },
    text: "You're awesome. Thank you for doing these, I'm trying...",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    likesCount: 15,
  },
];

const CommentSheet = ({
  visible,
  onClose,
  comments = [],
  postCaption,
  postAuthor,
  postCreatedAt,
  postId,
  totalComments = 0,
}) => {
  const [mounted, setMounted] = useState(visible);
  const [draftComment, setDraftComment] = useState("");
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

  const formattedPostDate = postCreatedAt
    ? formatDistanceToNow(new Date(postCreatedAt), { addSuffix: true })
    : null;

  const formatTimestamp = (value) => {
    if (!value) return "";
    try {
      const parsed = Number(value) ? new Date(Number(value)) : new Date(value);
      if (Number.isNaN(parsed.getTime())) return "";
      return formatDistanceToNow(parsed, { addSuffix: true });
    } catch (err) {
      return "";
    }
  };

  const handleEmojiPress = (emoji) => {
    setDraftComment((prev) => `${prev}${emoji}`);
  };

  const handleSend = () => {
    // Wire up to mutation later; keep UX responsive in the meantime
    setDraftComment("");
  };

  const renderCommentItem = (comment, level = 0) => {
    const name =
      comment?.author?.username || comment?.author?.name || "Anonymous";
    const dateText = formatTimestamp(comment?.createdAt);
    const likesLabel = comment?.likesCount ? comment.likesCount : 0;
    const hasReplies = Array.isArray(comment?.replies) && comment.replies.length;

    return (
      <View
        key={comment.id || name}
        style={[styles.commentBlock, level > 0 && styles.replyIndent]}
      >
        <View style={styles.commentRow}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color="#fef3c7" />
          </View>

          <View style={styles.commentBody}>
            <View style={styles.commentHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.commentAuthor}>{name}</Text>
                {dateText ? (
                  <Text style={styles.commentDate}>{dateText}</Text>
                ) : null}
              </View>
              <View style={styles.likePill}>
                <Ionicons name="heart-outline" size={14} color="#fef3c7" />
                <Text style={styles.likeCountText}>{likesLabel}</Text>
              </View>
            </View>

            <Text style={styles.commentText}>
              {comment?.text || comment?.body || "Thanks for sharing!"}
            </Text>

            <View style={styles.commentActionsRow}>
              <TouchableOpacity style={styles.replyButton} onPress={() => {}}>
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>
              {hasReplies ? (
                <Text style={styles.replyCount}>{`${comment.replies.length} repl${
                  comment.replies.length === 1 ? "y" : "ies"
                }`}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {hasReplies
          ? comment.replies.map((reply) => renderCommentItem(reply, level + 1))
          : null}
      </View>
    );
  };

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
          <View style={styles.dragHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Comments</Text>
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
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.postHeaderCard}>
              <View style={styles.posterRow}>
                <View style={styles.avatarPlaceholderLarge}>
                  <Ionicons name="person" size={18} color="#fef3c7" />
                </View>
                <View style={styles.posterMeta}>
                  <Text style={styles.posterName}>
                    {postAuthor?.username || postAuthor?.name || "Unknown"}
                  </Text>
                  {formattedPostDate ? (
                    <Text style={styles.posterDate}>{formattedPostDate}</Text>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.followButton}>
                  <Text style={styles.followText}>Follow</Text>
                </TouchableOpacity>
              </View>
              {postCaption ? (
                <Text style={styles.postCaption}>{postCaption}</Text>
              ) : null}
            </View>

            <Text style={styles.commentsCountLabel}>
              {`${totalComments || renderComments.length} comments`}
            </Text>

            {renderComments.map((comment) => renderCommentItem(comment))}
          </ScrollView>

          <View style={styles.emojiRow}>
            {EMOJI_ROW.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiButton}
                onPress={() => handleEmojiPress(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.composerRow}>
            <View style={styles.composerInputWrapper}>
              <TextInput
                style={styles.composerInput}
                placeholder="Add a comment"
                placeholderTextColor="#94a3b8"
                value={draftComment}
                onChangeText={setDraftComment}
                multiline
              />
            </View>
            <TouchableOpacity
              style={[styles.sendButton, !draftComment.trim() && styles.sendButtonDisabled]}
              disabled={!draftComment.trim()}
              onPress={handleSend}
              accessibilityLabel={`Send comment on post ${postId || ""}`}
            >
              <Ionicons name="send" size={18} color="#0b1224" />
            </TouchableOpacity>
          </View>
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
    paddingTop: 12,
    paddingBottom: 18,
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
  dragHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    backgroundColor: "rgba(148,163,184,0.5)",
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitle: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "800",
  },
  commentsList: {
    flex: 1,
  },
  postHeaderCard: {
    backgroundColor: "rgba(30,41,59,0.75)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    marginBottom: 12,
  },
  posterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarPlaceholderLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(245,158,11,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
  },
  posterMeta: {
    flex: 1,
  },
  posterName: {
    color: "#fef3c7",
    fontWeight: "800",
    fontSize: 15,
  },
  posterDate: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(14,165,233,0.2)",
    borderWidth: 1,
    borderColor: "#38bdf8",
  },
  followText: {
    color: "#e0f2fe",
    fontWeight: "700",
    fontSize: 13,
  },
  postCaption: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 20,
  },
  commentsCountLabel: {
    color: "#fef3c7",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
  },
  commentBlock: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148,163,184,0.35)",
  },
  replyIndent: {
    marginLeft: 48,
    borderBottomWidth: 0,
    paddingTop: 6,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(245,158,11,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
  },
  commentBody: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  commentAuthor: {
    color: "#fef3c7",
    fontWeight: "700",
    fontSize: 14,
  },
  commentDate: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  likePill: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(148,163,184,0.25)",
    borderRadius: 999,
  },
  likeCountText: {
    color: "#fef3c7",
    fontWeight: "700",
    fontSize: 13,
  },
  commentText: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20,
  },
  commentActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    columnGap: 12,
  },
  replyButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  replyText: {
    color: "#38bdf8",
    fontWeight: "700",
    fontSize: 13,
  },
  replyCount: {
    color: "#94a3b8",
    fontSize: 12,
  },
  emojiRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148,163,184,0.35)",
    marginBottom: 10,
  },
  emojiButton: {
    paddingHorizontal: 6,
  },
  emojiText: {
    fontSize: 20,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    marginTop: 4,
  },
  composerInputWrapper: {
    flex: 1,
    backgroundColor: "rgba(30,41,59,0.85)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  composerInput: {
    color: "#fef3c7",
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: "#38bdf8",
    borderRadius: 12,
    padding: 12,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(148,163,184,0.5)",
  },
});

export default CommentSheet;
