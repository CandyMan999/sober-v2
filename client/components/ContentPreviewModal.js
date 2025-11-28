import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import CommunityFeedLayout from "./CommunityFeedLayout";
import QuoteFeedLayout from "./QuoteFeedLayout";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
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
}) => {
  const [mounted, setMounted] = useState(visible);
  const [localItem, setLocalItem] = useState(item);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(WINDOW_HEIGHT)).current;
  const videoRef = useRef(null);

  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(WINDOW_HEIGHT * 0.12);
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
          damping: 16,
          stiffness: 180,
          mass: 0.9,
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
  }, [backdropOpacity, translateY, visible]);

  useEffect(() => {
    if (!visible && videoRef.current) {
      videoRef.current.pauseAsync?.();
    }
  }, [visible]);

  const handleClose = () => {
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > Math.abs(gesture.dx) && Math.abs(gesture.dy) > 6,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            translateY.setValue(gesture.dy);
            backdropOpacity.setValue(Math.max(0, 1 - gesture.dy / WINDOW_HEIGHT));
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > WINDOW_HEIGHT * 0.2 || gesture.vy > 1.2) {
            handleClose();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              damping: 18,
              stiffness: 220,
              mass: 0.9,
            }).start();
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: ANIMATION_DURATION,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [backdropOpacity, translateY]
  );

  if (!mounted) return null;

  const isPost = type === "POST";
  const content = localItem;

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
      />
    );
  };

  return (
    <Modal transparent animationType="none" visible={mounted} onRequestClose={handleClose}>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[styles.card, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#fef3c7" />
        </TouchableOpacity>
        {renderContent()}
      </Animated.View>
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
    paddingTop: 32,
  },
  closeButton: {
    position: "absolute",
    top: 32,
    right: 18,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 999,
    padding: 10,
  },
  mediaContainer: {
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: "#0f172a",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  mediaFallback: {
    backgroundColor: "#111827",
  },
  feedContent: {
    paddingTop: 84,
  },
});

export default ContentPreviewModal;
