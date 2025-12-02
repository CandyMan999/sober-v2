import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { useClient } from "../client";
import {
  DELETE_POST_MUTATION,
  DELETE_QUOTE_MUTATION,
} from "../GraphQL/mutations";
import { POST_BY_ID_QUERY, QUOTE_BY_ID_QUERY } from "../GraphQL/queries";
import { getToken } from "../utils/helpers";
import CommunityFeedLayout from "./CommunityFeedLayout";
import QuoteFeedLayout from "./QuoteFeedLayout";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const ACTION_SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * 0.26);
const ANIMATION_DURATION = 240;

const ContentPreviewModal = ({
  visible,
  item,
  type = "POST",
  onClose,
  viewerUser,
  onToggleSound,
  isMuted = true,
  onCommentAdded,
  onToggleFollow,
  onTogglePostLike,
  onToggleQuoteLike,
  onFlagForReview,
  onDelete,
  onToggleSave,
  onAdminModeratePost,
  onAdminModerateQuote,
  isSaved = false,
  disableDelete = false,
  hideSaveAction = false,
  deleteActionOffset = "5%",
}) => {
  const [mounted, setMounted] = useState(visible);
  const [localItem, setLocalItem] = useState(item);
  const [showActions, setShowActions] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(WINDOW_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const actionsTranslateY = useRef(
    new Animated.Value(ACTION_SHEET_HEIGHT + 60)
  ).current;
  const client = useMemo(() => useClient(), []);
  const isPost = type === "POST";
  const isInfo = type === "INFO";
  const isAdminViewer = viewerUser?.username === "CandyMan🍭";
  const backdropFalloffOpacity = useMemo(
    () =>
      dragY.interpolate({
        inputRange: [0, WINDOW_HEIGHT * 0.45],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [dragY]
  );
  const combinedBackdropOpacity = useMemo(
    () => Animated.multiply(backdropOpacity, backdropFalloffOpacity),
    [backdropFalloffOpacity, backdropOpacity]
  );
  const videoRef = useRef(null);

  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.setValue(0);
      translateY.setValue(48);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 140,
          mass: 1.05,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: WINDOW_HEIGHT,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          setLocalItem(null);
        }
      });
    }
  }, [backdropOpacity, dragY, translateY, visible]);

  useEffect(() => {
    if (!visible) {
      dragY.setValue(0);
    }
  }, [dragY, visible]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (visible) {
      videoRef.current.setStatusAsync?.({
        shouldPlay: true,
        positionMillis: 0,
      });
    } else {
      videoRef.current.pauseAsync?.();
    }
  }, [visible]);

  useEffect(() => {
    if (!videoRef.current || !visible) return;
    const isVideo = (localItem?.mediaType || "VIDEO") === "VIDEO";
    if (isVideo) {
      videoRef.current.setStatusAsync?.({
        shouldPlay: true,
        positionMillis: 0,
      });
    }
  }, [localItem, visible]);

  useEffect(() => {
    if (showActions) {
      setActionsVisible(true);
      Animated.spring(actionsTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 16,
        stiffness: 180,
        mass: 0.9,
      }).start();
    } else {
      Animated.timing(actionsTranslateY, {
        toValue: ACTION_SHEET_HEIGHT + 60,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => setActionsVisible(false));
    }
  }, [actionsTranslateY, showActions]);

  useEffect(() => {
    if (!visible) {
      setShowActions(false);
      setFlagging(false);
      setDeleting(false);
      setSaving(false);
      setModerating(false);
      setLoadingComments(false);
    }
  }, [visible]);

  const commentsLoadedForId = useRef(null);

  useEffect(() => {
    if (!visible) {
      setLoadingComments(false);
      commentsLoadedForId.current = null;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !localItem?.id || isInfo) return undefined;

    const hasComments = Array.isArray(localItem.comments)
      ? localItem.comments.length > 0
      : false;

    const alreadyLoaded = commentsLoadedForId.current === localItem.id;
    if (hasComments || alreadyLoaded) return undefined;

    let isActive = true;
    commentsLoadedForId.current = localItem.id;

    const loadComments = async () => {
      try {
        setLoadingComments(true);
        const token = await getToken();
        const query = isPost ? POST_BY_ID_QUERY : QUOTE_BY_ID_QUERY;
        const variables = isPost
          ? { postId: localItem.id, token }
          : { quoteId: localItem.id, token };

        const result = await client.request(query, variables);
        if (!isActive) return;

        const fetchedContent = isPost ? result?.post : result?.quote;
        if (fetchedContent && fetchedContent.id === localItem.id) {
          setLocalItem((prev) =>
            prev?.id === fetchedContent.id
              ? { ...prev, ...fetchedContent }
              : prev
          );
        }
      } catch (err) {
        console.error("Error loading preview comments", err);
        commentsLoadedForId.current = null;
      } finally {
        if (isActive) {
          setLoadingComments(false);
        }
      }
    };

    loadComments();

    return () => {
      isActive = false;
    };
  }, [client, isInfo, isPost, localItem?.id, visible]);

  const handleClose = () => {
    dragY.setValue(0);
    setShowActions(false);
    onClose?.();
  };

  const handleCommentAdded = (newComment) => {
    if (!newComment || !localItem) return;
    setLocalItem((prev) =>
      prev
        ? {
            ...prev,
            comments: [newComment, ...(prev.comments || [])],
            commentsCount: (prev.commentsCount || 0) + 1,
          }
        : prev
    );
    onCommentAdded?.(newComment);
  };

  const combinedTranslateY = useMemo(
    () => Animated.add(translateY, dragY),
    [dragY, translateY]
  );

  const handleGestureEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { translationY: dragY } }], {
        useNativeDriver: true,
      }),
    [dragY]
  );

  const handleGestureStateChange = useMemo(
    () =>
      ({ nativeEvent }) => {
        if (
          nativeEvent.state === State.END ||
          nativeEvent.state === State.CANCELLED ||
          nativeEvent.state === State.FAILED
        ) {
          const shouldClose =
            nativeEvent.translationY > WINDOW_HEIGHT * 0.12 ||
            nativeEvent.velocityY > 850;

          if (shouldClose) {
            handleClose();
          } else {
            Animated.parallel([
              Animated.spring(dragY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
                stiffness: 170,
                mass: 1,
              }),
              Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: ANIMATION_DURATION,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
            ]).start();
          }
        }
      },
    [backdropOpacity, dragY, handleClose]
  );

  const viewerId = viewerUser?.id;
  const content = isInfo
    ? localItem
    : localItem
    ? {
        ...localItem,
        createdAt:
          localItem.createdAt ||
          localItem.postCreatedAt ||
          localItem.video?.createdAt ||
          localItem.created_at ||
          null,
        author:
          localItem.author ||
          localItem.user ||
          localItem.postAuthor ||
          localItem.createdBy ||
          viewerUser,
        user:
          localItem.user ||
          localItem.author ||
          localItem.postAuthor ||
          localItem.createdBy ||
          viewerUser,
        postAuthor:
          localItem.postAuthor ||
          localItem.author ||
          localItem.user ||
          localItem.createdBy ||
          viewerUser,
        createdBy:
          localItem.createdBy ||
          localItem.author ||
          localItem.user ||
          localItem.postAuthor ||
          viewerUser,
        closestCity:
          localItem.closestCity ||
          (localItem.cityName ? { name: localItem.cityName } : null) ||
          null,
      }
    : null;

  const canDelete = useMemo(() => {
    if (disableDelete || !viewerId || !item || isInfo) return false;

    const ownerIds = [
      item.author?.id,
      item.user?.id,
      item.createdBy?.id,
      item.postAuthor?.id,
    ].filter(Boolean);

    return ownerIds.some((id) => id === viewerId);
  }, [disableDelete, isInfo, item, viewerId]);

  const isAdminReviewItem = useMemo(
    () => isAdminViewer && (content?.__adminItem ?? false),
    [content?.__adminItem, isAdminViewer]
  );

  const isLiked = useMemo(() => {
    if (!content || !viewerId || isInfo) return false;
    const likes = content.likes || [];
    return likes.some((like) => like?.user?.id === viewerId);
  }, [content, isInfo, viewerId]);

  if (!mounted) return null;

  const closeActionsSheet = () => setShowActions(false);
  const sheetTitle = isAdminReviewItem
    ? "Admin options"
    : isPost
    ? "Post options"
    : isInfo
    ? "Reminder"
    : "More options";
  const saveActionLabel = isSaved ? "Unsave" : "Save";

  const handleLikePress = () => {
    if (!content?.id || isInfo) return;
    if (isPost) {
      onTogglePostLike?.(content.id);
    } else {
      onToggleQuoteLike?.(content.id);
    }
  };

  const handleFlagPress = async () => {
    if (!content?.id || flagging || isInfo) return;
    setFlagging(true);
    try {
      await onFlagForReview?.(content.id, content.review);
    } finally {
      setFlagging(false);
      closeActionsSheet();
    }
  };

  const handleSavePress = async () => {
    if (!content?.id || saving || isInfo) return;
    setSaving(true);
    try {
      await onToggleSave?.(content, type);
    } catch (err) {
      console.error("Error toggling save", err);
    } finally {
      setSaving(false);
      closeActionsSheet();
    }
  };

  const handleDeletePress = async () => {
    if (!content?.id || deleting || !canDelete) return;
    const token = await getToken();
    if (!token) return;

    setDeleting(true);
    try {
      const variables = isPost
        ? { token, postId: content.id }
        : { token, quoteId: content.id };
      const mutation = isPost ? DELETE_POST_MUTATION : DELETE_QUOTE_MUTATION;

      await client.request(mutation, variables);
      onDelete?.(content.id, type);
      handleClose();
    } catch (err) {
      console.error("Error deleting content", err);
    } finally {
      setDeleting(false);
      closeActionsSheet();
    }
  };

  const handleAdminPostDecision = async (approve) => {
    if (!content?.id || moderating || !isAdminReviewItem || !isPost) return;
    setModerating(true);
    try {
      await onAdminModeratePost?.(content.id, approve);
    } finally {
      setModerating(false);
      closeActionsSheet();
    }
  };

  const handleAdminQuoteDecision = async (approve) => {
    if (!content?.id || moderating || !isAdminReviewItem || isPost) return;
    setModerating(true);
    try {
      await onAdminModerateQuote?.(content.id, approve);
    } finally {
      setModerating(false);
      closeActionsSheet();
    }
  };

  const renderPostMedia = () => {
    if (!content) return null;
    const isVideo = (content.mediaType || "VIDEO") === "VIDEO";

    if (isVideo) {
      return (
        <Video
          ref={videoRef}
          source={{ uri: content.video?.url }}
          style={styles.media}
          resizeMode={ResizeMode.COVER}
          shouldPlay={visible}
          isLooping
          isMuted={isMuted}
          key={content.id || content.video?.url}
        />
      );
    }

    if (content.imageUrl) {
      return <Image source={{ uri: content.imageUrl }} style={styles.media} />;
    }

    return <View style={[styles.media, styles.mediaFallback]} />;
  };

  const renderContent = () => {
    if (!content) return null;

    if (isInfo) {
      return (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>
            {content?.title || "Reminder"}
          </Text>
          {content?.text ? (
            <Text style={styles.infoBody}>{content.text}</Text>
          ) : null}
          {content?.day ? (
            <Text style={styles.infoFooter}>
              Average relapse day: Day {content.day}
            </Text>
          ) : null}
        </View>
      );
    }

    if (isPost) {
      return (
        <CommunityFeedLayout
          post={content}
          isMuted={isMuted}
          onToggleSound={onToggleSound}
          onCommentAdded={handleCommentAdded}
          contentStyle={styles.feedContent}
          viewerUserId={viewerUser?.id}
          onToggleFollow={onToggleFollow}
          isLiked={isLiked}
          onLikePress={handleLikePress}
          onMorePress={() => setShowActions(true)}
          showFilter={false}
        >
          <View style={styles.mediaContainer}>{renderPostMedia()}</View>
        </CommunityFeedLayout>
      );
    }

    return (
      <QuoteFeedLayout
        quote={content}
        onCommentAdded={handleCommentAdded}
        viewerUserId={viewerUser?.id}
        onToggleFollow={onToggleFollow}
        isLiked={isLiked}
        onLikePress={handleLikePress}
        onMorePress={() => setShowActions(true)}
      />
    );
  };

  return (
    <Modal
      transparent
      animationType="none"
      visible={mounted}
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[styles.backdrop, { opacity: combinedBackdropOpacity }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleGestureStateChange}
        activeOffsetY={[-6, 6]}
        failOffsetX={[-16, 16]}
      >
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: combinedTranslateY }] },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fef3c7" />
          </TouchableOpacity>
          {renderContent()}
        </Animated.View>
      </PanGestureHandler>

      {actionsVisible ? (
        <Modal
          visible
          animationType="fade"
          transparent
          onRequestClose={closeActionsSheet}
        >
          <View style={styles.modalContainer}>
            <Pressable
              style={styles.sheetBackdrop}
              onPress={closeActionsSheet}
            />
            <Animated.View
              style={[
                styles.bottomSheet,
                { transform: [{ translateY: actionsTranslateY }] },
              ]}
            >
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{sheetTitle}</Text>
                <TouchableOpacity
                  onPress={closeActionsSheet}
                  accessibilityRole="button"
                  accessibilityLabel="Close options"
                  style={styles.sheetCloseButton}
                >
                  <Ionicons name="close-circle" size={30} color="#e5e7eb" />
                </TouchableOpacity>
              </View>
              {isAdminReviewItem && isPost ? (
                <>
                  <TouchableOpacity
                    style={styles.sheetAction}
                    onPress={() => handleAdminPostDecision(true)}
                    disabled={moderating}
                  >
                    <View style={styles.sheetActionLeft}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#34d399"
                      />
                      <Text style={styles.sheetActionText}>Approve post</Text>
                    </View>
                    {moderating ? (
                      <ActivityIndicator
                        color="#34d399"
                        style={styles.sheetSpinner}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#9ca3af"
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sheetAction}
                    onPress={() => handleAdminPostDecision(false)}
                    disabled={moderating}
                  >
                    <View style={styles.sheetActionLeft}>
                      <Ionicons name="close-circle" size={20} color="#f87171" />
                      <Text style={styles.sheetActionText}>Deny post</Text>
                    </View>
                    {moderating ? (
                      <ActivityIndicator
                        color="#f87171"
                        style={styles.sheetSpinner}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#9ca3af"
                      />
                    )}
                  </TouchableOpacity>
                </>
              ) : null}
              {isAdminReviewItem && !isPost ? (
                <>
                  <TouchableOpacity
                    style={styles.sheetAction}
                    onPress={() => handleAdminQuoteDecision(true)}
                    disabled={moderating}
                  >
                    <View style={styles.sheetActionLeft}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#34d399"
                      />
                      <Text style={styles.sheetActionText}>Approve quote</Text>
                    </View>
                    {moderating ? (
                      <ActivityIndicator
                        color="#34d399"
                        style={styles.sheetSpinner}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#9ca3af"
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sheetAction}
                    onPress={() => handleAdminQuoteDecision(false)}
                    disabled={moderating}
                  >
                    <View style={styles.sheetActionLeft}>
                      <Ionicons name="close-circle" size={20} color="#f87171" />
                      <Text style={styles.sheetActionText}>Deny quote</Text>
                    </View>
                    {moderating ? (
                      <ActivityIndicator
                        color="#f87171"
                        style={styles.sheetSpinner}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#9ca3af"
                      />
                    )}
                  </TouchableOpacity>
                </>
              ) : null}
              {hideSaveAction ? null : (
                <TouchableOpacity
                  style={styles.sheetAction}
                  onPress={handleSavePress}
                  disabled={saving}
                >
                  <View style={styles.sheetActionLeft}>
                    <Ionicons
                      name="bookmark-outline"
                      size={20}
                      color="#fef3c7"
                    />
                    <Text style={styles.sheetActionText}>
                      {saveActionLabel}
                    </Text>
                  </View>
                  {saving ? (
                    <ActivityIndicator
                      color="#f59e0b"
                      style={styles.sheetSpinner}
                    />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#9ca3af"
                    />
                  )}
                </TouchableOpacity>
              )}
              {isPost && !canDelete ? (
                <TouchableOpacity
                  style={styles.sheetAction}
                  onPress={handleFlagPress}
                  disabled={flagging || content?.review}
                >
                  <View style={styles.sheetActionLeft}>
                    <Ionicons
                      name={content?.review ? "flag" : "flag-outline"}
                      size={20}
                      color="#fef3c7"
                    />
                    <Text style={styles.sheetActionText}>
                      {content?.review
                        ? "Already flagged for review"
                        : "Flag for review"}
                    </Text>
                  </View>
                  {flagging ? (
                    <ActivityIndicator
                      color="#f59e0b"
                      style={styles.sheetSpinner}
                    />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#9ca3af"
                    />
                  )}
                </TouchableOpacity>
              ) : null}
              {canDelete ? (
                <TouchableOpacity
                  style={[
                    styles.sheetAction,
                    deleteActionOffset
                      ? { marginTop: deleteActionOffset }
                      : null,
                  ]}
                  onPress={handleDeletePress}
                  disabled={deleting}
                >
                  <View style={styles.sheetActionLeft}>
                    <Ionicons name="trash-outline" size={20} color="#fef3c7" />
                    <Text style={styles.sheetActionText}>
                      {`Delete ${isPost ? "post" : "quote"}`}
                    </Text>
                  </View>
                  {deleting ? (
                    <ActivityIndicator
                      color="#f59e0b"
                      style={styles.sheetSpinner}
                    />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#9ca3af"
                    />
                  )}
                </TouchableOpacity>
              ) : null}
            </Animated.View>
          </View>
        </Modal>
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  card: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    paddingTop: 0,
  },
  closeButton: {
    position: "absolute",
    top: 28,
    right: 18,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 999,
    padding: 10,
  },
  mediaContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0f172a",
    flex: 1,
  },
  media: {
    width: "100%",
    height: "100%",
  },
  mediaFallback: {
    backgroundColor: "#111827",
  },
  feedContent: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "center",
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  infoContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    backgroundColor: "#0b1220",
    justifyContent: "center",
  },
  infoTitle: {
    color: "#fbbf24",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  infoBody: {
    color: "#e5e7eb",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  infoFooter: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 14,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: ACTION_SHEET_HEIGHT,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
  },
  sheetCloseButton: {
    padding: 0,
    marginLeft: 8,
    marginTop: -8,
  },
  sheetAction: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(30,41,59,0.85)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sheetActionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sheetActionText: {
    color: "#fef3c7",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 12,
  },
  sheetSpinner: {
    marginLeft: 8,
  },
});

export default ContentPreviewModal;
