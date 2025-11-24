import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
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

const PAGE_SIZE = 5;

const CommunityScreen = () => {
  const client = useClient();
  const isFocused = useIsFocused();
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [containerHeight, setContainerHeight] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [finishedMap, setFinishedMap] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [reviewingPostId, setReviewingPostId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  const cursorRef = useRef(null);
  const videoRefs = useRef({});

  const fetchPosts = useCallback(
    async (append = false) => {
      const nextCursor = append ? cursorRef.current : null;

      try {
        if (!append) {
          setLoading(true);
          setError("");
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
      }
    },
    [client]
  );

  useEffect(() => {
    fetchPosts(false);
    // Intentionally run once on mount to avoid re-fetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (
        numericIdx === activeIndex &&
        !finishedMap[numericIdx] &&
        isFocused
      ) {
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
        shouldPlay={
          isFocused && activeIndex === index && !finishedMap[index]
        }
        isLooping={false}
        isMuted={isMuted}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatus(index, status)}
      />
      {finishedMap[index] ? renderOverlay(index) : null}
    </Pressable>
  );

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
      setSelectedPost(null);
    }
  };

  const handleMorePress = (post) => {
    setSelectedPost(post);
  };

  const closeMoreSheet = () => {
    setSelectedPost(null);
  };

  const handleToggleSound = () => {
    setIsMuted((prev) => !prev);
  };

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
    if (diffDays < 30) return `about ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    if (diffMonths < 12)
      return `about ${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;

    return `about ${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  };

  const renderItem = ({ item, index }) => {
    const captionText = item.text || "";
    const avatarUrl = item.author?.profilePicUrl || null;
    const postDate = formatDate(item.createdAt);

    return (
      <View style={{ height: containerHeight || 0 }}>
        <FeedLayout
          caption={captionText}
          meta={postDate}
          likesCount={item.likesCount}
          commentsCount={item.commentsCount}
          comments={item.comments}
          avatarUrl={avatarUrl}
          contentStyle={styles.feedContent}
          showSoundToggle
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          onMorePress={() => handleMorePress(item)}
        >
          {renderVideo(item, index)}
        </FeedLayout>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.root} onLayout={handleLayout}>
        <FeedLayout caption="Loading videos...">
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
    return (
      <View style={styles.root} onLayout={handleLayout}>
        <FeedLayout
          caption={posts[0].text || ""}
          likesCount={posts[0].likesCount}
          commentsCount={posts[0].commentsCount}
          comments={posts[0].comments}
          avatarUrl={posts[0].author?.profilePicUrl || null}
          contentStyle={styles.feedContent}
          showSoundToggle
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          onMorePress={() => handleMorePress(posts[0])}
        >
          {renderVideo(posts[0], 0)}
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
        bounces={false}
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

      {selectedPost ? (
        <>
          <Pressable style={styles.sheetBackdrop} onPress={closeMoreSheet} />
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Post options</Text>
            <TouchableOpacity
              style={styles.sheetAction}
              onPress={() => handleReviewPress(selectedPost.id, selectedPost.review)}
              disabled={reviewingPostId === selectedPost.id}
            >
              <Text style={styles.sheetActionText}>
                {selectedPost.review ? "Unmark for review" : "Flag for review"}
              </Text>
              {reviewingPostId === selectedPost.id ? (
                <ActivityIndicator color="#f59e0b" style={styles.sheetSpinner} />
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancel} onPress={closeMoreSheet}>
              <Text style={styles.sheetCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
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
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
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
    marginBottom: 12,
  },
  sheetAction: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetActionText: {
    color: "#fef3c7",
    fontSize: 15,
    fontWeight: "600",
  },
  sheetSpinner: {
    marginLeft: 8,
  },
  sheetCancel: {
    marginTop: 6,
    paddingVertical: 12,
  },
  sheetCancelText: {
    color: "#93c5fd",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default CommunityScreen;
