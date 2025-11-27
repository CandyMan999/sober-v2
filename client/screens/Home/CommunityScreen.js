import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { FeedLayout, FilterSheet } from "../../components";
import { GET_ALL_POSTS } from "../../GraphQL/queries";
import { useClient } from "../../client";
import {
  RECORD_POST_VIEW_MUTATION,
  SET_POST_REVIEW_MUTATION,
  TOGGLE_LIKE_MUTATION,
} from "../../GraphQL/mutations";
import { getToken } from "../../utils/helpers";
import Context from "../../context";

const TUTORIAL_SEEN_KEY = "community_tutorial_seen";
const tutorialImage = require("../../assets/swipe1.png");

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const PAGE_SIZE = 5;
const SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * 0.33);

const CommunityScreen = () => {
  const client = useClient();
  const isFocused = useIsFocused();
  const { state } = useContext(Context);
  const currentUserId = state?.user?.id;
  const currentUser = state?.user;
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
  const [reviewBypass, setReviewBypass] = useState({});
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const isPostLiked = useCallback(
    (post) => {
      if (!currentUserId) return false;
      return (post?.likes || []).some(
        (like) => like?.user?.id === currentUserId
      );
    },
    [currentUserId]
  );

  const applyPostLikePayload = useCallback(
    (postId, payload) => {
      if (!payload) return;

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;

          const existingLikes = post.likes || [];
          const actorId = payload.like?.user?.id || currentUserId;
          const filtered = existingLikes.filter(
            (like) => like?.user?.id !== actorId
          );

          if (payload.liked && payload.like) {
            return {
              ...post,
              likesCount: payload.likesCount,
              likes: [...filtered, payload.like],
            };
          }

          return {
            ...post,
            likesCount: payload.likesCount,
            likes: filtered,
          };
        })
      );
    },
    [currentUserId]
  );

  const handleToggleLike = useCallback(
    async (postId) => {
      const token = await getToken();
      if (!token) return;

      const previous = posts.map((post) => ({
        ...post,
        likes: post.likes ? [...post.likes] : [],
      }));

      const target = posts.find((post) => post.id === postId);
      const currentlyLiked = isPostLiked(target);
      const optimisticUser = currentUser || { id: currentUserId };

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;

          const filtered = (post.likes || []).filter(
            (like) => like?.user?.id !== currentUserId
          );

          const optimisticLikes = currentlyLiked
            ? filtered
            : [
                ...filtered,
                { id: `temp-like-${postId}`, user: optimisticUser },
              ];

          return {
            ...post,
            likesCount: Math.max(
              0,
              (post.likesCount || 0) + (currentlyLiked ? -1 : 1)
            ),
            likes: optimisticLikes,
          };
        })
      );

      try {
        const data = await client.request(TOGGLE_LIKE_MUTATION, {
          token,
          targetType: "POST",
          targetId: postId,
        });

        applyPostLikePayload(postId, data?.toggleLike);
      } catch (err) {
        console.error("Error toggling post like", err);
        setPosts(previous);
      }
    },
    [
      applyPostLikePayload,
      client,
      currentUser,
      currentUserId,
      isPostLiked,
      posts,
    ]
  );

  const cursorRef = useRef(null);
  const videoRefs = useRef({});
  const viewedPostsRef = useRef(new Set());

  const buildFilterParams = useCallback(
    (filterLabel = activeFilter) => {
      switch (filterLabel) {
        case "Milestones":
          return {
            isMilestone: true,
            mediaType: null,
            excludeViewed: true,
            sortByClosest: false,
          };
        case "Images":
          return {
            isMilestone: null,
            mediaType: "IMAGE",
            excludeViewed: true,
            sortByClosest: false,
          };
        case "Nearby":
          return {
            isMilestone: null,
            mediaType: null,
            excludeViewed: true,
            sortByClosest: true,
          };
        case "All":
        default:
          return {
            isMilestone: null,
            mediaType: null,
            excludeViewed: true,
            sortByClosest: false,
          };
      }
    },
    [activeFilter]
  );

  const fetchPosts = useCallback(
    async (append = false, { isRefresh = false, filterOverride } = {}) => {
      const nextCursor = append ? cursorRef.current : null;

      const filterParams = buildFilterParams(filterOverride);

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

        const token = await getToken();
        const viewerLat = state?.user?.lat ?? null;
        const viewerLong = state?.user?.long ?? null;

        const data = await client.request(GET_ALL_POSTS, {
          limit: PAGE_SIZE,
          cursor: nextCursor,
          token: token || null,
          lat: viewerLat,
          long: viewerLong,
          excludeViewed: filterParams.excludeViewed,
          sortByClosest: filterParams.sortByClosest,
          isMilestone: filterParams.isMilestone,
          mediaType: filterParams.mediaType,
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
    [buildFilterParams, client, state?.user?.lat, state?.user?.long]
  );

  const fetchPostsRef = useRef(fetchPosts);

  useEffect(() => {
    fetchPostsRef.current = fetchPosts;
  }, [fetchPosts]);

  useEffect(() => {
    setHasMore(true);
    setCursor(null);
    cursorRef.current = null;
    setPosts([]);
    setError("");
    setLoading(true);
    fetchPostsRef.current(false, {
      isRefresh: true,
      filterOverride: activeFilter,
    });
  }, [activeFilter]);

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
    const currentPost = posts[activeIndex];
    if (!currentPost) return;

    const type = currentPost.mediaType || "VIDEO";
    const isVideoPost = type === "VIDEO";
    const isUnderReview = currentPost.review && !reviewBypass[currentPost.id];

    if (isVideoPost && !isUnderReview) {
      recordViewForPost(currentPost);
    }
  }, [activeIndex, posts, recordViewForPost, reviewBypass]);

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

  const renderReviewOverlay = (item) => (
    <View style={styles.reviewOverlay} pointerEvents="auto">
      <BlurView
        tint="dark"
        intensity={90}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.reviewCard}>
        <View style={styles.reviewBadgeRow}>
          <Ionicons name="shield-checkmark" size={16} color="#facc15" />
          <Text style={styles.reviewBadgeText}>Safety filter</Text>
        </View>
        <Text style={styles.reviewTitle}>
          This post is under review for possible inappropriate content.
        </Text>

        <TouchableOpacity
          style={styles.reviewPrimaryButton}
          activeOpacity={0.85}
          onPress={() =>
            setReviewBypass((prev) => ({
              ...prev,
              [item.id]: true,
            }))
          }
        >
          <Ionicons name="eye-outline" size={18} color="#0f172a" />
          <Text style={styles.reviewPrimaryText}>View anyway</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVideo = (item, index, isUnderReview) => (
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
          isFocused &&
          activeIndex === index &&
          !finishedMap[index] &&
          !isUnderReview
        }
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
    const isUnderReview = item.review && !reviewBypass[item.id];

    const mediaContent =
      type === "IMAGE"
        ? renderImage(item)
        : renderVideo(item, index, isUnderReview);

    return (
      <View style={styles.mediaContainer}>
        {mediaContent}
        {isUnderReview ? renderReviewOverlay(item) : null}
      </View>
    );
  };

  const handleReviewPress = async (postId, currentReviewState) => {
    if (reviewingPostId || currentReviewState) {
      closeMoreSheet();
      return;
    }

    setReviewingPostId(postId);
    try {
      const data = await client.request(SET_POST_REVIEW_MUTATION, {
        postId,
        review: true,
      });

      const updatedReview = data?.setPostReview?.review ?? true;

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

  const openFilterSheet = useCallback(() => setShowFilterSheet(true), []);
  const closeFilterSheet = useCallback(() => setShowFilterSheet(false), []);

  const handleFilterChange = useCallback(
    (nextFilter) => {
      if (nextFilter === "Friends") return;
      setActiveFilter(nextFilter || null);
      closeFilterSheet();
    },
    [closeFilterSheet]
  );

  const handleToggleSound = () => {
    setIsMuted((prev) => !prev);
  };

  const handleCommentAdded = useCallback((postId, newComment) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentsCount: (post.commentsCount || 0) + 1,
              comments: [newComment, ...(post.comments || [])],
            }
          : post
      )
    );
  }, []);

  const getViewsCount = useCallback((post) => {
    if (!post) return 0;
    if (typeof post.viewsCount === "number") return post.viewsCount;
    return post.video?.viewsCount ?? 0;
  }, []);

  const recordViewForPost = useCallback(
    async (post) => {
      if (!post?.id) return;
      if (viewedPostsRef.current.has(post.id)) return;

      const isUnderReview = post.review && !reviewBypass[post.id];
      if (isUnderReview) return;

      const token = await getToken();
      if (!token) return;

      try {
        const data = await client.request(RECORD_POST_VIEW_MUTATION, {
          token,
          postId: post.id,
        });

        viewedPostsRef.current.add(post.id);
        const updatedPost = data?.recordPostView;
        if (updatedPost) {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    video: updatedPost.video ?? p.video,
                    viewsCount:
                      updatedPost.viewsCount ??
                      updatedPost.video?.viewsCount ??
                      p.viewsCount ??
                      p.video?.viewsCount ??
                      0,
                  }
                : p
            )
          );
        }
      } catch (err) {
        console.error("Error recording post view", err);
      }
    },
    [client, reviewBypass]
  );

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

    if (Number.isNaN(parsed?.getTime?.())) {
      const numericParsed = new Date(Number(dateString));
      if (Number.isNaN(numericParsed?.getTime?.())) return "";

      return numericParsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderItem = ({ item, index }) => {
    const captionText = item.text || "";
    const avatarUrl = item.author?.profilePicUrl || null;
    const postDate = formatDate(item.createdAt);
    const type = item.mediaType || "VIDEO";
    const isVideoPost = type === "VIDEO";
    const cityName = item.closestCity?.name || null;
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
          viewsCount={getViewsCount(item)}
          comments={item.comments}
          postId={item.id}
          postCreatedAt={item.createdAt}
          postAuthor={item.author}
          avatarUrl={avatarUrl}
          cityName={cityName}
          isMilestonePost={isMilestonePost}
          isVideoPost={isVideoPost}
          onCommentAdded={(newComment) =>
            handleCommentAdded(item.id, newComment)
          }
          contentStyle={styles.feedContent}
          showSoundToggle={isVideoPost}
          isMuted={isVideoPost ? isMuted : true}
          onToggleSound={isVideoPost ? handleToggleSound : undefined}
          isLiked={isPostLiked(item)}
          onLikePress={() => handleToggleLike(item.id)}
          onMorePress={() => handleMorePress(item)}
          onFilterPress={openFilterSheet}
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
    const firstCityName = firstPost.closestCity?.name || null;
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
          viewsCount={getViewsCount(firstPost)}
          comments={firstPost.comments}
          postId={firstPost.id}
          postCreatedAt={firstPost.createdAt}
          postAuthor={firstPost.author}
          avatarUrl={firstPost.author?.profilePicUrl || null}
          cityName={firstCityName}
          meta={firstMetaText}
          isMilestonePost={firstIsMilestone}
          isVideoPost={firstIsVideo}
          onCommentAdded={(newComment) =>
            handleCommentAdded(firstPost.id, newComment)
          }
          contentStyle={styles.feedContent}
          showSoundToggle={firstIsVideo}
          isMuted={firstIsVideo ? isMuted : true}
          onToggleSound={firstIsVideo ? handleToggleSound : undefined}
          isLiked={isPostLiked(firstPost)}
          onLikePress={() => handleToggleLike(firstPost.id)}
          onMorePress={() => handleMorePress(firstPost)}
          onFilterPress={openFilterSheet}
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
                disabled={
                  reviewingPostId === selectedPost.id || selectedPost.review
                }
              >
                <View style={styles.sheetActionLeft}>
                  <Ionicons
                    name={selectedPost.review ? "flag" : "flag-outline"}
                    size={20}
                    color="#fef3c7"
                  />
                  <Text style={styles.sheetActionText}>
                    {selectedPost.review
                      ? "Already flagged for review"
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

      <FilterSheet
        visible={showFilterSheet}
        onClose={closeFilterSheet}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

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
  mediaContainer: {
    position: "relative",
    flex: 1,
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
  reviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewCard: {
    width: "86%",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "rgba(15,23,42,0.94)",
    borderWidth: 1,
    borderColor: "rgba(248,250,252,0.16)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  reviewBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.4)",
    marginBottom: 10,
  },
  reviewBadgeText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#facc15",
  },
  reviewTitle: {
    color: "#f8fafc",
    fontSize: 16,

    textAlign: "left",
    fontWeight: "700",
    marginBottom: 20,
  },

  reviewPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#f59e0b",
    shadowColor: "#f59e0b",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  reviewPrimaryText: {
    marginLeft: 8,
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.6,
    textTransform: "uppercase",
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
