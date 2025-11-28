import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
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
  const dragY = useRef(new Animated.Value(0)).current;
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
      videoRef.current.setStatusAsync?.({ shouldPlay: true, positionMillis: 0 });
    } else {
      videoRef.current.pauseAsync?.();
    }
  }, [visible]);

  useEffect(() => {
    if (!videoRef.current || !visible) return;
    const isVideo = (localItem?.mediaType || "VIDEO") === "VIDEO";
    if (isVideo) {
      videoRef.current.setStatusAsync?.({ shouldPlay: true, positionMillis: 0 });
    }
  }, [localItem, visible]);

  const handleClose = () => {
    dragY.setValue(0);
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

  if (!mounted) return null;

  const isPost = type === "POST";
  const content = localItem
    ? {
        ...localItem,
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
      }
    : null;

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
        <Animated.View style={[styles.card, { transform: [{ translateY: combinedTranslateY }] }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fef3c7" />
          </TouchableOpacity>
          {renderContent()}
        </Animated.View>
      </PanGestureHandler>
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
});

export default ContentPreviewModal;
