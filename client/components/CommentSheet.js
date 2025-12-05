import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
  useCallback,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
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
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useClient } from "../client";
import { TOGGLE_LIKE_MUTATION } from "../GraphQL/mutations";
import {
  CREATE_POST_COMMENT,
  CREATE_QUOTE_COMMENT,
} from "../GraphQL/mutations/comments";
import { getToken } from "../utils/helpers";
import Context from "../context";
import Avatar from "./Avatar";

const soberLogo = require("../assets/icon.png");

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * 0.8);
const EMOJI_ROW = ["❤️", "😍", "🔥", "👏", "😮", "🙏", "👍", "😢", "😂", "🎉"];

const parseDateValue = (value) => {
  if (!value) return null;
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    const fromNum = new Date(numeric);
    if (!Number.isNaN(fromNum.getTime())) return fromNum;
  }

  const fromString = new Date(value);
  return Number.isNaN(fromString.getTime()) ? null : fromString;
};

const formatRelativeDate = (value) => {
  const parsed = parseDateValue(value);
  if (!parsed) return "";
  return `${formatDistanceToNow(parsed)} ago`;
};

// Remove line breaks entirely and keep text tight
const sanitizeCommentText = (value) => {
  if (!value) return "";
  let text = String(value);

  // Trim trailing/leading whitespace
  text = text.trim();

  // Replace all line breaks (and surrounding spaces) with a single space
  text = text.replace(/\s*\n+\s*/g, " ");

  return text;
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
  targetType = "POST",
  targetId,
  postCityName,
  onToggleFollow,
  canFollow = false,
  isFollowed = false,
  isBuddy = false,
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const { state } = useContext(Context);
  const likeScales = useRef({});
  const likeBurstScales = useRef({});
  const likeBurstOpacities = useRef({});
  const [followState, setFollowState] = useState({
    isFollowed,
    isBuddy,
  });
  const [followPending, setFollowPending] = useState(false);
  const isQuoteSheet = targetType === "QUOTE";
  const navigation = useNavigation();

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

  const mapCommentsWithLiked = (list = []) =>
    (list || []).map((comment) => {
      const liked = Array.isArray(comment?.likes)
        ? comment.likes.some((like) => like?.user?.id === userId)
        : false;
      const replies = comment?.replies?.length
        ? mapCommentsWithLiked(comment.replies)
        : [];

      return { ...comment, liked, replies };
    });

  useEffect(() => {
    setCommentList(mapCommentsWithLiked(comments || []));
  }, [comments, userId]);

  useEffect(() => {
    setFollowState({ isFollowed, isBuddy });
  }, [isBuddy, isFollowed]);

  useEffect(() => {
    setCommentCount(totalComments || comments?.length || 0);
  }, [comments?.length, totalComments]);

  useEffect(() => {
    const handleKeyboardShow = (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    };
    const handleKeyboardHide = () => setKeyboardHeight(0);

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const userId = state?.user?.id;
  const composerAvatarUri =
    state?.user?.profilePicUrl || state?.user?.profilePic?.url || null;

  const findCommentById = (list, id) => {
    for (const comment of list || []) {
      if (comment.id === id) return comment;
      if (comment.replies?.length) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateCommentById = (list, id, updater) =>
    (list || []).map((comment) => {
      if (comment.id === id) {
        return updater(comment);
      }

      if (comment.replies?.length) {
        const updatedReplies = updateCommentById(comment.replies, id, updater);

        if (updatedReplies !== comment.replies) {
          return { ...comment, replies: updatedReplies };
        }
      }

      return comment;
    });

  const ensureAnimValue = (store, key, initialValue) => {
    if (!store.current[key]) {
      store.current[key] = new Animated.Value(initialValue);
    }
    return store.current[key];
  };

  const getHeartScale = (commentId) =>
    ensureAnimValue(likeScales, commentId, 1);
  const getBurstScale = (commentId) =>
    ensureAnimValue(likeBurstScales, commentId, 0);
  const getBurstOpacity = (commentId) =>
    ensureAnimValue(likeBurstOpacities, commentId, 0);

  const runLikeAnimation = (commentId, activating) => {
    const heartScale = getHeartScale(commentId);
    const burstScale = getBurstScale(commentId);
    const burstOpacity = getBurstOpacity(commentId);

    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.12,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();

    if (activating) {
      burstScale.setValue(0.4);
      burstOpacity.setValue(0.55);

      Animated.parallel([
        Animated.timing(burstScale, {
          toValue: 1.3,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(burstOpacity, {
          toValue: 0,
          duration: 220,
          delay: 70,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const translateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT + 60, 0],
  });

  const formattedPostDate = useMemo(
    () => formatRelativeDate(postCreatedAt),
    [postCreatedAt]
  );

  const commentTargetId = targetId || postId;
  const isQuoteTarget = targetType === "QUOTE";
  const effectiveAuthor =
    isQuoteSheet && !postAuthor ? { username: "Sober Motivation" } : postAuthor;
  const posterName =
    effectiveAuthor?.username ||
    effectiveAuthor?.name ||
    (isQuoteSheet ? "Sober Motivation" : "Unknown");

  const followLabel = followState.isBuddy
    ? "Buddies"
    : followState.isFollowed
    ? "Following"
    : "Follow";

  const followChipStyles = [
    styles.followChip,
    followState.isBuddy
      ? styles.buddyChip
      : followState.isFollowed
      ? styles.followingChip
      : null,
  ];

  const followIcon = followState.isBuddy
    ? "people"
    : followState.isFollowed
    ? "checkmark-circle-outline"
    : "person-add-outline";

  const followTextStyle = [
    styles.followChipText,
    followState.isBuddy ? styles.buddyChipText : null,
    followState.isFollowed && !followState.isBuddy
      ? styles.followingChipText
      : null,
  ];

  const followIconColor =
    followState.isFollowed && !followState.isBuddy ? "#e2e8f0" : "#0b1222";

  const handleFollowPress = async () => {
    if (!onToggleFollow || followPending || !canFollow) return;

    const previous = followState;
    setFollowState({ isFollowed: !previous.isFollowed, isBuddy: false });
    try {
      setFollowPending(true);
      const result = await onToggleFollow();

      if (result) {
        setFollowState({
          isFollowed: Boolean(result.isFollowed),
          isBuddy: Boolean(result.isBuddy),
        });
      }
    } catch (err) {
      console.error("Failed to toggle follow", err);
      setFollowState(previous);
    } finally {
      setFollowPending(false);
    }
  };

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

  // 🔧 FIX: emoji tap injects into input + focuses it
  const handleEmojiPress = (emoji) => {
    setDraftComment((prev) => (prev ? `${prev}${emoji}` : emoji));
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

  const handleToggleLike = async (commentId) => {
    const snapshot = findCommentById(commentList, commentId);
    if (!snapshot?.id) return;

    const nextLiked = !snapshot.liked;
    runLikeAnimation(commentId, nextLiked);

    setCommentList((prev) =>
      updateCommentById(prev, commentId, (comment) => {
        const nextCount = Math.max(
          0,
          (comment.likesCount || 0) + (nextLiked ? 1 : -1)
        );
        return { ...comment, liked: nextLiked, likesCount: nextCount };
      })
    );

    try {
      const token = await getToken();
      const data = await client.request(TOGGLE_LIKE_MUTATION, {
        token,
        targetType: "COMMENT",
        targetId: commentId,
      });

      const payload = data?.toggleLike;

      if (payload) {
        setCommentList((prev) =>
          updateCommentById(prev, commentId, (comment) => ({
            ...comment,
            liked: payload.liked,
            likesCount: payload.likesCount ?? comment.likesCount ?? 0,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to toggle comment like", err);
      setCommentList((prev) =>
        updateCommentById(prev, commentId, (comment) => ({
          ...comment,
          liked: snapshot.liked,
          likesCount: snapshot.likesCount ?? 0,
        }))
      );
    }
  };

  const handleSend = async () => {
    if (!draftComment.trim() || submitting || !commentTargetId) return;

    try {
      setSubmitting(true);
      const token = await getToken();
      const variables = {
        token,
        text: draftComment.trim(),
        replyTo: replyTarget?.id || null,
      };

      if (isQuoteTarget) {
        variables.quoteId = commentTargetId;
      } else {
        variables.postId = commentTargetId;
      }

      const mutation = isQuoteTarget
        ? CREATE_QUOTE_COMMENT
        : CREATE_POST_COMMENT;

      const data = await client.request(mutation, variables);

      const newComment = isQuoteTarget
        ? data?.createQuoteComment
        : data?.createPostComment;

      if (newComment) {
        const hydratedNewComment =
          mapCommentsWithLiked([newComment])?.[0] || newComment;
        setCommentList((prev) => {
          if (replyTarget?.id) {
            return mergeReply(prev, replyTarget.id, hydratedNewComment);
          }
          return [hydratedNewComment, ...prev];
        });
        setCommentCount((prev) => prev + 1);
        onCommentAdded?.(hydratedNewComment);
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

  /**
   * isLastReplyInThread:
   * - false for all top-level comments
   * - true ONLY for the last reply inside an open thread
   */
  const renderCommentItem = (
    comment,
    level = 0,
    isLastReplyInThread = false
  ) => {
    const isSoberQuoteComment = isQuoteSheet && !comment?.author;
    const name =
      (isSoberQuoteComment && "Sober Motivation") ||
      comment?.author?.username ||
      comment?.author?.name ||
      "User";
    const dateText = formatRelativeDate(comment?.createdAt);
    const replyCount = Array.isArray(comment?.replies)
      ? comment.replies.length
      : 0;
    const showReplies = expandedThreads.has(comment.id);
    const avatarUri = comment?.author?.profilePicUrl;
    const textValue = comment?.text || comment?.body || "";
    const cleanedText = sanitizeCommentText(textValue);
    const isTopLevel = level === 0;
    const replyTargetName =
      level > 0 && comment?.replyTo?.author
        ? comment.replyTo.author.username ||
          comment.replyTo.author.name ||
          "User"
        : null;
    const heartScale = getHeartScale(comment.id);
    const burstScale = getBurstScale(comment.id);
    const burstOpacity = getBurstOpacity(comment.id);
    const likeIcon = comment.liked ? "heart" : "heart-outline";
    const likeColor = comment.liked ? "#fb7185" : "#fef3c7";

    return (
      <View
        key={comment.id || `${name}-${level}`}
        style={[
          styles.commentSection,
          isLastReplyInThread && styles.commentSectionLastReply, // only last reply in thread gets the bottom line
        ]}
      >
        <View style={styles.commentRow}>
          <Avatar
            uri={avatarUri}
            fallbackSource={isSoberQuoteComment ? soberLogo : null}
            haloColor={avatarUri ? "orange" : "blue"}
            size={32}
            userId={
              comment?.author?.id ||
              comment?.author?._id ||
              comment?.author?.userId
            }
            username={comment?.author?.username}
            onPress={() => handleProfilePress(comment?.author)}
            style={styles.commentAvatarHalo}
          />

          <View style={styles.commentBody}>
            <View style={styles.commentHeaderRow}>
              <View style={styles.commentHeaderMain}>
                <Text style={styles.commentAuthor}>{name}</Text>
                {replyTargetName ? (
                  <View style={styles.replyTargetRow}>
                    <Text style={styles.replyArrow}>›</Text>
                    <Text style={styles.replyTargetName}>
                      {replyTargetName}
                    </Text>
                  </View>
                ) : null}
              </View>
              {dateText && isTopLevel ? (
                <Text style={styles.commentDate}>{dateText}</Text>
              ) : null}
            </View>

            {cleanedText ? (
              <Text style={styles.commentText}>{cleanedText}</Text>
            ) : null}

            <View style={styles.commentActionsRow}>
              <TouchableOpacity
                style={styles.replyButton}
                onPress={() => startReply(comment)}
              >
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>
              {!isTopLevel && dateText ? (
                <Text style={styles.commentReplyDate}>{dateText}</Text>
              ) : null}
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
            </View>
          </View>

          <View style={styles.likeColumn}>
            <TouchableOpacity
              style={[styles.likePill, comment.liked && styles.likePillActive]}
              onPress={() => handleToggleLike(comment.id)}
            >
              <View style={styles.likeBurstWrapper}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.likeBurst,
                    {
                      opacity: burstOpacity,
                      transform: [{ scale: burstScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={{ transform: [{ scale: heartScale }] }}
                  pointerEvents="none"
                >
                  <Ionicons name={likeIcon} size={16} color={likeColor} />
                </Animated.View>
              </View>
              <Text
                style={[
                  styles.likeCountText,
                  comment.liked && styles.likeCountTextActive,
                ]}
              >
                {comment?.likesCount || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Replies block – only controls spacing, NOT borders */}
        {showReplies && replyCount > 0 ? (
          <View style={styles.repliesBlock}>
            {comment.replies.map((reply, index) => {
              const isLastReply = index === replyCount - 1;
              return (
                <View style={styles.replyIndent} key={reply.id}>
                  {renderCommentItem(reply, level + 1, isLastReply)}
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  const handleProfilePress = useCallback(
    (author) => {
      const targetId = author?.id || author?._id || author?.userId;
      if (!targetId || targetId === userId) return;

      const profileImage =
        author?.profilePicUrl || author?.profilePic?.url || null;
      onClose?.();
      navigation.navigate("UserProfile", {
        userId: targetId,
        initialUser: {
          id: targetId,
          username: author?.username,
          profilePicUrl: profileImage,
        },
      });
    },
    [navigation, onClose, userId]
  );
  if (!mounted) return null;

  const effectiveCount = commentCount || commentList.length;
  const canSend = draftComment.trim().length > 0 && !submitting;

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
          behavior={"padding"}
          style={styles.avoider}
          keyboardVerticalOffset={Platform.OS === "ios" ? 36 : 12}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [{ translateY }],
                paddingBottom: 12 + keyboardHeight,
              },
            ]}
          >
            <View style={styles.dragHandle} />

            <View style={styles.postHeader}>
              <View style={styles.posterRow}>
                <Avatar
                  uri={
                    effectiveAuthor?.profilePicUrl ||
                    effectiveAuthor?.profilePic?.url
                  }
                  fallbackSource={
                    isQuoteSheet && !postAuthor ? soberLogo : null
                  }
                  haloColor={
                    effectiveAuthor?.profilePicUrl ||
                    effectiveAuthor?.profilePic?.url
                      ? "orange"
                      : "blue"
                  }
                  size={32}
                  userId={
                    effectiveAuthor?.id ||
                    effectiveAuthor?._id ||
                    effectiveAuthor?.userId
                  }
                  username={effectiveAuthor?.username}
                  onPress={() => handleProfilePress(effectiveAuthor)}
                  style={styles.headerAvatarHalo}
                />

                <View style={styles.posterMeta}>
                  <View style={styles.posterNameRow}>
                    <Text style={styles.posterName} numberOfLines={1}>
                      {posterName}
                    </Text>

                    {canFollow ? (
                      <TouchableOpacity
                        style={styles.followChipWrapper}
                        onPress={handleFollowPress}
                        activeOpacity={0.9}
                        disabled={followPending}
                      >
                        <View style={followChipStyles}>
                          <View style={styles.followChipContent}>
                            <Ionicons
                              name={followIcon}
                              size={16}
                              color={followIconColor}
                              style={styles.followChipIcon}
                            />
                            <Text style={followTextStyle}>
                              {followPending ? "..." : followLabel}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close comments"
                  style={styles.closeButton}
                >
                  <Ionicons name="close-circle" size={32} color="#e5e7eb" />
                </TouchableOpacity>
              </View>

              {postCaption && !isQuoteSheet ? (
                <Text style={styles.postCaption}>{postCaption}</Text>
              ) : null}

              {formattedPostDate || postCityName ? (
                <View style={styles.posterMetaRow}>
                  {formattedPostDate ? (
                    <Text style={styles.posterDate}>{formattedPostDate}</Text>
                  ) : null}

                  {postCityName ? (
                    <>
                      {formattedPostDate ? (
                        <Text style={styles.posterMetaDivider}> • </Text>
                      ) : null}
                      <View style={styles.posterLocationRow}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#38bdf8"
                          style={styles.posterLocationIcon}
                        />
                        <Text style={styles.posterLocationText}>
                          {postCityName}
                        </Text>
                      </View>
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View style={styles.headerDivider} />

            <ScrollView
              style={styles.commentsList}
              contentContainerStyle={{ paddingBottom: 12 + keyboardHeight }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.commentsCountLabel}>
                {`${effectiveCount} Comment${effectiveCount === 1 ? "" : "s"}`}
              </Text>

              {commentList.length === 0 ? (
                <Text style={styles.emptyText}>No comments yet</Text>
              ) : (
                commentList.map((comment, index) =>
                  // Top-level comments are NEVER "last reply in a thread"
                  renderCommentItem(comment, 0, false)
                )
              )}
            </ScrollView>

            {/* Full-width top divider for emoji row, no extra padding/margin */}
            <View style={styles.emojiDivider} />

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

            <View style={styles.composerContainer}>
              <Avatar
                uri={composerAvatarUri}
                haloColor="blue"
                size={32}
                disableNavigation
                style={styles.composerAvatarHalo}
              />

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

                  <TouchableOpacity
                    style={[
                      styles.inlineSendButton,
                      (!draftComment.trim() || submitting) &&
                        styles.inlineSendButtonDisabled,
                    ]}
                    disabled={!draftComment.trim() || submitting}
                    onPress={handleSend}
                    accessibilityLabel={`Send comment on post ${postId || ""}`}
                  >
                    <Ionicons
                      name={submitting ? "time-outline" : "send"}
                      size={17}
                      color={canSend ? "#38bdf8" : "#64748b"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
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
    paddingHorizontal: 10, // horizontal padding = 10
    paddingTop: 5,
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
    marginBottom: 8,
  },
  postHeader: {
    paddingHorizontal: 2,
    paddingBottom: 8,
  },
  posterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerAvatarHalo: {
    marginRight: 10,
  },
  posterMeta: {
    flex: 1,
    marginHorizontal: 8,
  },
  posterNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  posterMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 6,
  },
  posterMetaDivider: {
    color: "#38bdf8",
    fontWeight: "700",
  },
  posterLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  posterLocationIcon: {
    marginRight: 4,
  },
  posterLocationText: {
    color: "#38bdf8",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  posterName: {
    color: "#fef3c7",
    fontWeight: "800",
    fontSize: 15,
  },
  followChipWrapper: {
    marginLeft: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  followChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#fbbf24",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  followingChip: {
    backgroundColor: "#0b1222",
    borderColor: "#fbbf24",
  },
  buddyChip: {
    backgroundColor: "#22d3ee",
    borderColor: "#0ea5e9",
  },
  followChipContent: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  followChipIcon: {
    marginRight: 6,
  },
  followChipText: {
    color: "#0b1222",
    fontWeight: "800",
    fontSize: 14,
  },
  followingChipText: {
    color: "#e2e8f0",
  },
  buddyChipText: {
    color: "#0b1222",
  },
  posterDate: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  postCaption: {
    color: "#e5e7eb",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    marginTop: 4,
  },
  closeButton: {
    padding: 0,
    marginLeft: 6,
    marginTop: -20,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(148,163,184,0.5)",
    marginHorizontal: -10,
    marginBottom: 6,
  },
  commentsList: {
    flex: 1,
  },
  commentsCountLabel: {
    color: "#F59E0B",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 6,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
  },
  commentSection: {
    paddingBottom: 2,
    // no borders here; border only on last reply in thread
  },
  commentSectionLastReply: {
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148,163,184,0.25)",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 8,
  },
  commentAvatarHalo: {
    paddingVertical: 2,
  },
  commentBody: {
    flex: 1,
    paddingRight: 4,
    marginBottom: 15,
  },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  commentHeaderMain: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  replyTargetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: "auto",
    columnGap: 4,
  },
  replyArrow: {
    color: "#94a3b8",
    fontSize: 12,
    marginLeft: 2,
  },
  replyTargetName: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 13,
  },
  commentAuthor: {
    color: "#fef3c7",
    fontWeight: "700",
    fontSize: 14,
    marginRight: 8,
  },
  commentDate: {
    color: "#94a3b8",
    fontSize: 11,
  },
  commentReplyDate: {
    color: "#94a3b8",
    fontSize: 11,
    marginRight: 6,
  },
  commentText: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 18,
  },
  commentActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    columnGap: 8,
  },
  replyButton: {
    paddingVertical: 2,
    paddingHorizontal: 2,
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
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.18)",
  },
  replyToggleText: {
    color: "#cbd5e1",
    fontSize: 12,
  },
  likeColumn: {
    justifyContent: "flex-start",
    alignItems: "flex-end",
    marginLeft: 2,
  },
  likePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.18)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    minWidth: 32,
    columnGap: 4,
  },
  likePillActive: {
    backgroundColor: "rgba(251, 113, 133, 0.16)",
    borderColor: "rgba(251, 113, 133, 0.6)",
  },
  likeBurstWrapper: {
    position: "relative",
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  likeBurst: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(251, 113, 133, 0.2)",
  },
  likeCountText: {
    color: "#fef3c7",
    fontWeight: "700",
    fontSize: 13,
  },
  likeCountTextActive: {
    color: "#fb7185",
  },
  repliesBlock: {
    marginTop: 2,
  },
  replyIndent: {
    marginLeft: 40,
  },
  emojiDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(148,163,184,0.5)",
    marginHorizontal: -10,
  },
  emojiRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  emojiButton: {
    paddingHorizontal: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 6,
  },
  replyingToText: {
    color: "#bfdbfe",
    fontSize: 13,
  },
  composerContainer: {
    marginTop: 2,
    paddingLeft: 40, // room for bottom-left avatar halo
    position: "relative",
  },
  composerAvatarHalo: {
    position: "absolute",
    left: 0,
    bottom: 8,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 3,
  },
  composerInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  composerInput: {
    flex: 1,
    color: "#fef3c7",
    fontSize: 14,
    maxHeight: 80,
    paddingRight: 8,
  },
  inlineSendButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  inlineSendButtonDisabled: {
    opacity: 0.4,
  },
});

export default CommentSheet;
