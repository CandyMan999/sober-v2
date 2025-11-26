import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useClient } from "../client";
import { CREATE_POST_COMMENT } from "../GraphQL/mutations/comments";
import { getToken } from "../utils/helpers";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * 0.8);
const EMOJI_ROW = ["❤️", "😍", "🔥", "👏", "😮", "🙏", "👍", "😢", "😂", "🎉"];

const formatPostDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatCommentDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

const CommentSheet = ({
  visible,
  onClose,
  comments = [],
  postCaption,
  postAuthor,
  postCreatedAt,
  postId,
  totalComments = 0,
  onCommentAdded,
}) => {
  const client = useClient();
  const [mounted, setMounted] = useState(visible);
  const [draftComment, setDraftComment] = useState("");
  const [commentList, setCommentList] = useState(comments);
  const [commentCount, setCommentCount] = useState(
    totalComments || comments?.length || 0
  );
  const [replyTarget, setReplyTarget] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

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
          setReplyTarget(null);
          setDraftComment("");
        }
      });
    }
  }, [sheetAnim, visible]);

  useEffect(() => {
    setCommentList(comments || []);
  }, [comments]);

  useEffect(() => {
    setCommentCount(totalComments || comments?.length || 0);
  }, [comments?.length, totalComments]);

  const translateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT + 60, 0],
  });

  const formattedPostDate = useMemo(
    () => formatPostDate(postCreatedAt),
    [postCreatedAt]
  );

  const toggleReplies = (commentId) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleEmojiPress = (emoji) => {
    setDraftComment((prev) => `${prev}${emoji}`);
    inputRef.current?.focus();
  };

  const mergeReply = (list, parentId, reply) =>
    list.map((item) => {
      if (item.id === parentId) {
        const updatedReplies = [...(item.replies || []), reply];
        return { ...item, replies: updatedReplies };
      }

      if (item.replies?.length) {
        return { ...item, replies: mergeReply(item.replies, parentId, reply) };
      }

      return item;
    });

  const handleSend = async () => {
    if (!draftComment.trim() || submitting || !postId) return;

    try {
      setSubmitting(true);
      const token = await getToken();
      const variables = {
        token,
        postId,
        text: draftComment.trim(),
        replyTo: replyTarget?.id || null,
      };

      const data = await client.request(CREATE_POST_COMMENT, variables);
      const newComment = data?.createPostComment;

      if (newComment) {
        setCommentList((prev) => {
          if (replyTarget?.id) {
            return mergeReply(prev, replyTarget.id, newComment);
          }
          return [newComment, ...prev];
        });
        setCommentCount((prev) => prev + 1);
        onCommentAdded?.(newComment);
      }

      setDraftComment("");
      setReplyTarget(null);
      Keyboard.dismiss();
    } catch (err) {
      console.error("Failed to send comment", err);
    } finally {
      setSubmitting(false);
    }
  };

  const startReply = (comment) => {
    setReplyTarget(comment);
    toggleReplies(comment.id);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const renderCommentItem = (comment, level = 0) => {
    const name = comment?.author?.username || comment?.author?.name || "User";
    const dateText = formatCommentDate(comment?.createdAt);
    const replyCount = Array.isArray(comment?.replies)
      ? comment.replies.length
      : 0;
    const showReplies = expandedThreads.has(comment.id);
    const avatarUri = comment?.author?.profilePicUrl;

    return (
      <View key={comment.id || `${name}-${level}`} style={styles.commentSection}>
        <View style={styles.commentRow}>
          <View style={styles.avatarWrapper}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={16} color="#111827" />
              </View>
            )}
          </View>

          <View style={styles.commentBody}>
            <View style={styles.commentHeaderRow}>
              <Text style={styles.commentAuthor}>{name}</Text>
              {dateText ? <Text style={styles.commentDate}>{dateText}</Text> : null}
            </View>

            <Text style={styles.commentText}>
              {comment?.text || comment?.body || ""}
            </Text>

            <View style={styles.commentActionsRow}>
              <TouchableOpacity
                style={styles.replyButton}
                onPress={() => startReply(comment)}
              >
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>

              {replyCount > 0 ? (
                <TouchableOpacity
                  style={styles.replyToggle}
                  onPress={() => toggleReplies(comment.id)}
                >
                  <Ionicons
                    name={showReplies ? "chevron-up" : "chevron-down"}
                    size={14}
                    color="#94a3b8"
                  />
                  <Text style={styles.replyToggleText}>
                    {`${replyCount} repl${replyCount === 1 ? "y" : "ies"}`}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <View style={styles.likePill}>
                <Ionicons name="heart-outline" size={14} color="#fef3c7" />
                <Text style={styles.likeCountText}>
                  {comment?.likesCount || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {showReplies && replyCount > 0
          ? comment.replies.map((reply) => (
              <View style={styles.replyIndent} key={reply.id}>
                {renderCommentItem(reply, level + 1)}
              </View>
            ))
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.avoider}
          keyboardVerticalOffset={Platform.OS === "ios" ? 32 : 0}
        >
          <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
            <View style={styles.dragHandle} />

            <View style={styles.postHeaderCard}>
              <View style={styles.posterRow}>
                <View style={styles.avatarLargeWrapper}>
                  {postAuthor?.profilePicUrl ? (
                    <Image
                      source={{ uri: postAuthor.profilePicUrl }}
                      style={styles.avatarLarge}
                    />
                  ) : (
                    <View style={[styles.avatarLarge, styles.avatarFallback]}>
                      <Ionicons name="person" size={20} color="#111827" />
                    </View>
                  )}
                </View>
                <View style={styles.posterMeta}>
                  <Text style={styles.posterName} numberOfLines={1}>
                    {postAuthor?.username || postAuthor?.name || "Unknown"}
                  </Text>
                  {formattedPostDate ? (
                    <Text style={styles.posterDate}>{formattedPostDate}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close comments"
                >
                  <Ionicons name="close" size={22} color="#cbd5e1" />
                </TouchableOpacity>
              </View>
              {postCaption ? (
                <Text style={styles.postCaption}>{postCaption}</Text>
              ) : null}
            </View>

            <ScrollView
              style={styles.commentsList}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.commentsCountLabel}>
                {`${commentCount || commentList.length} comment${
                  (commentCount || commentList.length) === 1 ? "" : "s"
                }`}
              </Text>

              {commentList.length === 0 ? (
                <Text style={styles.emptyText}>No comments yet</Text>
              ) : (
                commentList.map((comment) => renderCommentItem(comment))
              )}
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

            {replyTarget ? (
              <View style={styles.replyingToBar}>
                <Text style={styles.replyingToText}>
                  Replying to {replyTarget?.author?.username || "comment"}
                </Text>
                <TouchableOpacity onPress={() => setReplyTarget(null)}>
                  <Ionicons name="close" size={16} color="#e2e8f0" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.composerRow}>
              <View style={styles.composerInputWrapper}>
                <TextInput
                  ref={inputRef}
                  style={styles.composerInput}
                  placeholder="Add a comment"
                  placeholderTextColor="#94a3b8"
                  value={draftComment}
                  onChangeText={setDraftComment}
                  multiline
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!draftComment.trim() || submitting) && styles.sendButtonDisabled,
                ]}
                disabled={!draftComment.trim() || submitting}
                onPress={handleSend}
                accessibilityLabel={`Send comment on post ${postId || ""}`}
              >
                {submitting ? (
                  <Ionicons name="time-outline" size={18} color="#0b1224" />
                ) : (
                  <Text style={styles.sendText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
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
  avoider: {
    flex: 1,
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
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#0b1224",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  dragHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    alignSelf: "center",
    backgroundColor: "rgba(148,163,184,0.5)",
    marginBottom: 12,
  },
  postHeaderCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
    marginBottom: 12,
  },
  posterRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
    marginBottom: 8,
  },
  avatarLargeWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
  },
  avatarLarge: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
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
    color: "#cbd5e1",
    fontSize: 13,
    marginTop: 2,
  },
  postCaption: {
    color: "#e2e8f0",
    fontSize: 15,
    lineHeight: 20,
  },
  commentsList: {
    flex: 1,
  },
  commentsCountLabel: {
    color: "#fef3c7",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 10,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 6,
  },
  commentSection: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148,163,184,0.25)",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 10,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  commentBody: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  commentAuthor: {
    color: "#fef3c7",
    fontWeight: "700",
    fontSize: 14,
    marginRight: 8,
  },
  commentDate: {
    color: "#94a3b8",
    fontSize: 12,
  },
  commentText: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20,
  },
  commentActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
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
  replyToggle: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(148,163,184,0.15)",
  },
  replyToggleText: {
    color: "#cbd5e1",
    fontSize: 12,
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
  replyIndent: {
    marginLeft: 46,
    marginTop: 10,
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
  replyingToBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(59,130,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  replyingToText: {
    color: "#bfdbfe",
    fontSize: 13,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(148,163,184,0.5)",
  },
  sendText: {
    color: "#0b1224",
    fontWeight: "800",
  },
});

export default CommentSheet;
