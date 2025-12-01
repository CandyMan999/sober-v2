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
}) => {
  const [mounted, setMounted] = useState(visible);
  const [localItem, setLocalItem] = useState(item);
  const [showActions, setShowActions] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(WINDOW_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const actionsTranslateY = useRef(
    new Animated.Value(ACTION_SHEET_HEIGHT + 60)
  ).current;
  const client = useClient();
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
    }
  }, [visible]);

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

  const isPost = type === "POST";
  const viewerId = viewerUser?.id;
  const content = localItem
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
    if (!viewerId || !content) return false;

    const ownerIds = [
      content.author?.id,
      content.user?.id,
      content.createdBy?.id,
      content.postAuthor?.id,
    ].filter(Boolean);

    return ownerIds.some((id) => id === viewerId);
  }, [content, viewerId]);

  const isLiked = useMemo(() => {
    if (!content || !viewerId) return false;
    const likes = content.likes || [];
    return likes.some((like) => like?.user?.id === viewerId);
  }, [content, viewerId]);

  if (!mounted) return null;

  const closeActionsSheet = () => setShowActions(false);

  const handleLikePress = () => {
    if (!content?.id) return;
    if (isPost) {
      onTogglePostLike?.(content.id);
    } else {
      onToggleQuoteLike?.(content.id);
    }
  };

  const handleFlagPress = async () => {
    if (!content?.id || flagging) return;
    setFlagging(true);
    try {
      await onFlagForReview?.(content.id, content.review);
    } finally {
      setFlagging(false);
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
        onMorePress={canDelete ? () => setShowActions(true) : undefined}
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
              <Text style={styles.sheetTitle}>
                {isPost ? "Post options" : "Quote options"}
              </Text>
              {isPost && !canDelete ? (
                <TouchableOpacity style={styles.sheetAction} onPress={() => {}}>
                  <View style={styles.sheetActionLeft}>
                    <Ionicons
                      name="bookmark-outline"
                      size={20}
                      color="#fef3c7"
                    />
                    <Text style={styles.sheetActionText}>Save</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
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
                  style={styles.sheetAction}
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
              <TouchableOpacity
                style={styles.sheetCancel}
                onPress={closeActionsSheet}
              >
                <Text style={styles.sheetCancelText}>Close</Text>
              </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 28,
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  sheetTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
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
  sheetCancel: {
    marginTop: 4,
    paddingVertical: 12,
  },
  sheetCancelText: {
    color: "#93c5fd",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default ContentPreviewModal;
