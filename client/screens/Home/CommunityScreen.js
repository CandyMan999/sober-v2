import React, { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Animated,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  View,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { ResizeMode, Video } from "expo-av";
import { FeedLayout } from "../../components";
import { GET_ALL_POSTS } from "../../GraphQL/queries";
import { useClient } from "../../client";
import { SET_POST_REVIEW_MUTATION } from "../../GraphQL/mutations";

const TUTORIAL_SEEN_KEY = "community_tutorial_seen";
const tutorialImage = require("../../assets/swipe1.png");

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const PAGE_SIZE = 5;
const SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * 0.33);

const CommunityScreen = () => {
  const client = useClient();
  const isFocused = useIsFocused();
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [containerHeight, setContainerHeight] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [finishedMap, setFinishedMap] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [reviewingPostId, setReviewingPostId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const cursorRef = useRef(null);
  const videoRefs = useRef({});

  const fetchPosts = useCallback(
    async (append = false, { isRefresh = false } = {}) => {
      const nextCursor = append ? cursorRef.current : null;

      try {
        if (!append) {
          setError("");
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }
        } else {
          setLoadingMore(true);
        }

        const data = await client.request(GET_ALL_POSTS, {
          limit: PAGE_SIZE,
          cursor: nextCursor,
        });

        const payload = data?.getAllPosts;

        if (!payload) {
          throw new Error("No posts returned");
        }

        setPosts((prev) =>
          append ? [...prev, ...(payload.posts || [])] : payload.posts || []
        );
        const nextCursorValue = payload.cursor || null;
        setCursor(nextCursorValue);
        cursorRef.current = nextCursorValue;
        setHasMore(Boolean(payload.hasMore));
      } catch (err) {
        console.error("Error fetching posts", err);
        setError("There was a problem loading the community feed.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [client]
  );

  useEffect(() => {
    fetchPosts(false);
    // Intentionally run once on mount to avoid re-fetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const maybeShowTutorial = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem(TUTORIAL_SEEN_KEY);

        if (!hasSeen) {
          setShowTutorial(true);
          await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, "true");
        }
      } catch (err) {
        console.error("Failed to read tutorial flag", err);
      }
    };

    maybeShowTutorial();
  }, []);

  const handleLayout = (e) => {
    const { height } = e.nativeEvent.layout;
    // Align snap height to the visible viewport so overlays mirror Quotes.
    setContainerHeight(height);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchPosts(true);
  };

  const handleRefresh = () => {
    if (loading || refreshing) return;
    setHasMore(true);
    setCursor(null);
    cursorRef.current = null;
    fetchPosts(false, { isRefresh: true });
  };

  const handlePlaybackStatus = useCallback((index, status) => {
    if (!status) return;
    if (status.didJustFinish) {
      setFinishedMap((prev) => ({ ...prev, [index]: true }));
    }
  }, []);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idx, ref]) => {
      const numericIdx = Number(idx);

      if (!ref) return;

      if (numericIdx === activeIndex && !finishedMap[numericIdx] && isFocused) {
        ref.playAsync && ref.playAsync();
      } else {
        ref.pauseAsync && ref.pauseAsync();
      }
    });
  }, [activeIndex, finishedMap, isFocused]);

  useEffect(() => {
    if (isFocused) return;

    // Pause all videos and mute audio when leaving the screen
    Object.values(videoRefs.current).forEach((ref) => {
      if (ref?.pauseAsync) {
        ref.pauseAsync();
      }
    });
    setIsMuted(true);
  }, [isFocused]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!viewableItems?.length) return;
    const index = viewableItems[0].index ?? 0;
    setActiveIndex(index);
    setFinishedMap((prev) => ({ ...prev, [index]: false }));
  });

  const replayVideo = (index) => {
    const ref = videoRefs.current[index];
    if (ref?.replayAsync) {
      ref.replayAsync();
    }
    setFinishedMap((prev) => ({ ...prev, [index]: false }));
    setActiveIndex(index);
  };

  const renderOverlay = (index) => (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.replayButton}
        onPress={() => replayVideo(index)}
        activeOpacity={0.9}
      >
        <BlurView intensity={70} tint="dark" style={styles.replayGlass} />
        <View style={styles.replayContent}>
          <Ionicons name="refresh" size={20} color="#fef3c7" />
          <Text style={styles.replayText}>Watch Again</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderVideo = (item, index) => (
    <Pressable style={styles.videoWrapper} onPress={() => setIsMuted(true)}>
      <Video
        ref={(ref) => {
          if (ref) {
            videoRefs.current[index] = ref;
          }
        }}
        source={{ uri: item.video?.url }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isFocused && activeIndex === index && !finishedMap[index]}
        isLooping={false}
        isMuted={isMuted}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatus(index, status)}
      />
      {finishedMap[index] ? renderOverlay(index) : null}
    </Pressable>
  );

  const renderImage = (item) => (
    <View style={styles.imageWrapper}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>Image unavailable</Text>
        </View>
      )}
    </View>
  );

  const renderMedia = (item, index) => {
    const type = item.mediaType || "VIDEO";
    if (type === "IMAGE") {
      return renderImage(item);
    }

    return renderVideo(item, index);
  };

  const handleReviewPress = async (postId, currentReviewState) => {
    if (reviewingPostId) return;

    setReviewingPostId(postId);
    try {
      const data = await client.request(SET_POST_REVIEW_MUTATION, {
        postId,
        review: !currentReviewState,
      });

      const updatedReview = data?.setPostReview?.review ?? !currentReviewState;

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, review: updatedReview } : post
        )
      );
      setSelectedPost((prev) =>
        prev && prev.id === postId ? { ...prev, review: updatedReview } : prev
      );
    } catch (err) {
      console.error("Error updating review status", err);
    } finally {
      setReviewingPostId(null);
      closeMoreSheet();
    }
  };

  const handleMorePress = (post) => {
    setSelectedPost(post);
  };

  const closeMoreSheet = () => {
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
      mass: 0.9,
    }).start(() => setSelectedPost(null));
  };

  const handleToggleSound = () => {
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    if (!selectedPost) return;

    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
      mass: 0.9,
    }).start();
  }, [selectedPost, sheetAnim]);

  const translateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT + 60, 0],
  });

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const parsed = new Date(String(dateString).trim());
    const now = Date.now();
    const diffMs = now - parsed.getTime();

    if (Number.isNaN(parsed.getTime()) || diffMs < 0) return "";

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return "Just now";
    if (diffMinutes < 60)
      return `about ${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
      return `about ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 30)
      return `about ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    if (diffMonths < 12)
      return `about ${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;

    return `about ${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  };

  const renderItem = ({ item, index }) => {
    const captionText = item.text || "";
    const avatarUrl = item.author?.profilePicUrl || null;
    const postDate = formatDate(item.createdAt);
    const type = item.mediaType || "VIDEO";
    const isVideoPost = type === "VIDEO";
    const isMilestonePost = item.isMilestone || Boolean(item.milestoneTag);
    const milestoneLabel =
      item.milestoneDays !== null && item.milestoneDays !== undefined
        ? `Day ${item.milestoneDays} milestone`
        : item.milestoneTag || null;
    const metaText =
      isMilestonePost && milestoneLabel
        ? `${milestoneLabel} • ${postDate}`
        : postDate;
    const captionStyle = isMilestonePost ? styles.milestoneCaption : undefined;

    return (
      <View style={{ height: containerHeight || 0 }}>
        <FeedLayout
          caption={captionText}
          captionStyle={captionStyle}
          meta={metaText}
          likesCount={item.likesCount}
          commentsCount={item.commentsCount}
          comments={item.comments}
          avatarUrl={avatarUrl}
          contentStyle={styles.feedContent}
          showSoundToggle={isVideoPost}
          isMuted={isVideoPost ? isMuted : true}
          onToggleSound={isVideoPost ? handleToggleSound : undefined}
          onMorePress={() => handleMorePress(item)}
        >
          {renderMedia(item, index)}
        </FeedLayout>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.root} onLayout={handleLayout}>
        <FeedLayout caption="Loading posts...">
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#f59e0b" />
          </View>
        </FeedLayout>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root} onLayout={handleLayout}>
        <FeedLayout caption="Community">
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </FeedLayout>
      </View>
    );
  }

  if (!posts.length) {
    return (
      <View style={styles.root} onLayout={handleLayout}>
        <FeedLayout caption="Community">
          <View style={styles.center}>
            <Text style={styles.emptyText}>No posts yet. Check back soon.</Text>
          </View>
        </FeedLayout>
      </View>
    );
  }

  if (!containerHeight) {
    const firstPost = posts[0];
    const firstType = firstPost.mediaType || "VIDEO";
    const firstIsVideo = firstType === "VIDEO";
    const firstPostDate = formatDate(firstPost.createdAt);
    const firstIsMilestone =
      firstPost.isMilestone || Boolean(firstPost.milestoneTag);
    const firstMilestoneLabel =
      firstPost.milestoneDays !== null && firstPost.milestoneDays !== undefined
        ? `Day ${firstPost.milestoneDays} milestone`
        : firstPost.milestoneTag || null;
    const firstMetaText =
      firstIsMilestone && firstMilestoneLabel
        ? `${firstMilestoneLabel} • ${firstPostDate}`
        : firstPostDate;

    return (
      <View style={styles.root} onLayout={handleLayout}>
        <FeedLayout
          caption={firstPost.text || ""}
          captionStyle={firstIsMilestone ? styles.milestoneCaption : undefined}
          likesCount={firstPost.likesCount}
          commentsCount={firstPost.commentsCount}
          comments={firstPost.comments}
          avatarUrl={firstPost.author?.profilePicUrl || null}
          meta={firstMetaText}
          contentStyle={styles.feedContent}
          showSoundToggle={firstIsVideo}
          isMuted={firstIsVideo ? isMuted : true}
          onToggleSound={firstIsVideo ? handleToggleSound : undefined}
          onMorePress={() => handleMorePress(firstPost)}
        >
          {renderMedia(firstPost, 0)}
        </FeedLayout>
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces
        alwaysBounceVertical
        onRefresh={handleRefresh}
        refreshing={refreshing}
        snapToInterval={containerHeight}
        getItemLayout={(_, index) => ({
          length: containerHeight,
          offset: containerHeight * index,
          index,
        })}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 80 }}
        onViewableItemsChanged={onViewableItemsChanged.current}
        onEndReachedThreshold={0.5}
        onEndReached={handleLoadMore}
        ListFooterComponent={() =>
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color="#f59e0b" />
            </View>
          ) : null
        }
      />

      {/* Pull-to-refresh loader overlay */}
      {refreshing && (
        <View style={styles.refreshOverlay} pointerEvents="none">
          <BlurView intensity={40} tint="dark" style={styles.refreshBlur} />
          <View style={styles.refreshContent}>
            <ActivityIndicator size="large" color="white" />
          </View>
        </View>
      )}

      {selectedPost ? (
        <Modal
          animationType="none"
          transparent
          visible
          onRequestClose={closeMoreSheet}
        >
          <View style={styles.modalContainer}>
            <Pressable style={styles.sheetBackdrop} onPress={closeMoreSheet} />
            <Animated.View
              style={[styles.bottomSheet, { transform: [{ translateY }] }]}
            >
              <Text style={styles.sheetTitle}>Post options</Text>
              <TouchableOpacity style={styles.sheetAction} onPress={() => {}}>
                <View style={styles.sheetActionLeft}>
                  <Ionicons name="bookmark-outline" size={20} color="#fef3c7" />
                  <Text style={styles.sheetActionText}>Save</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() =>
                  handleReviewPress(selectedPost.id, selectedPost.review)
                }
                disabled={reviewingPostId === selectedPost.id}
              >
                <View style={styles.sheetActionLeft}>
                  <Ionicons
                    name={selectedPost.review ? "flag" : "flag-outline"}
                    size={20}
                    color="#fef3c7"
                  />
                  <Text style={styles.sheetActionText}>
                    {selectedPost.review
                      ? "Unmark for review"
                      : "Flag for review"}
                  </Text>
                </View>
                {reviewingPostId === selectedPost.id ? (
                  <ActivityIndicator
                    color="#f59e0b"
                    style={styles.sheetSpinner}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetCancel}
                onPress={closeMoreSheet}
              >
                <Text style={styles.sheetCancelText}>Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      ) : null}

      <Modal transparent visible={showTutorial} animationType="fade">
        <Pressable
          style={styles.tutorialOverlay}
          onPress={() => setShowTutorial(false)}
        >
          <Image source={tutorialImage} style={styles.tutorialImage} />
          <TouchableOpacity
            style={styles.tutorialClose}
            onPress={() => setShowTutorial(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#f97373",
    fontSize: 16,
    textAlign: "center",
  },
  feedContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  milestoneCaption: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  videoWrapper: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  imageWrapper: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  imageFallbackText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  replayButton: {
    overflow: "hidden",
    borderRadius: 999,
    minWidth: 170,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.5)",
  },
  replayGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  replayContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 10,
  },
  replayText: {
    color: "#fef3c7",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.4,
  },
  footer: {
    paddingVertical: 20,
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
    height: SHEET_HEIGHT,
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
  tutorialOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  tutorialImage: {
    width: "80%",
    height: "80%",
    // resizeMode: "contain",
    position: "absolute",
    bottom: 0,
  },
  tutorialClose: {
    position: "absolute",
    top: 40,
    right: 24,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 999,
  },
  refreshOverlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  refreshBlur: {
    position: "absolute",
    borderRadius: 999,
    width: 200,
    height: 42,
  },
  refreshContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  refreshText: {
    marginLeft: 10,
    color: "#fef3c7",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default CommunityScreen;
