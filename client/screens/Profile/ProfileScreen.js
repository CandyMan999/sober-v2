import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { TabView } from "react-native-tab-view";

import Context from "../../context";
import { useClient } from "../../client";
import { getToken } from "../../utils/helpers";
import {
  PROFILE_OVERVIEW_QUERY,
  FETCH_ME_QUERY,
  ADMIN_REVIEW_ITEMS_QUERY,
  USER_NOTIFICATIONS_QUERY,
  USER_POSTS_PAGINATED_QUERY,
} from "../../GraphQL/queries";
import { MY_DIRECT_ROOMS } from "../../GraphQL/directMessages";
import {
  TOGGLE_LIKE_MUTATION,
  SET_POST_REVIEW_MUTATION,
  TOGGLE_SAVE_MUTATION,
  MODERATE_POST_MUTATION,
  MODERATE_QUOTE_MUTATION,
} from "../../GraphQL/mutations";
import { ContentPreviewModal } from "../../components";
import {
  applySavedStateToContext,
  isItemSaved,
  mergeSavedList,
  removeSavedItem,
} from "../../utils/saves";

const AVATAR_SIZE = 110;
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const soberLogo = require("../../assets/icon.png");
const PROFILE_PAGE_SIZE = 12;
const LOAD_MORE_THRESHOLD = 360;
const fetchGuard = (ref, value) => {
  // keep a ref in sync with state to avoid stale reads inside callbacks
  // without forcing re-renders
  // eslint-disable-next-line no-param-reassign
  ref.current = value;
};

const dedupeById = (list = []) => {
  const seen = new Set();
  return list.filter((item) => {
    const id = item?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const ProfileScreen = ({ navigation }) => {
  const { state, dispatch } = useContext(Context);
  const client = useClient();
  const layout = useWindowDimensions();
  const cachedOverview = state?.profileOverview;
  const hasCachedProfile = Boolean(cachedOverview);
  const [loading, setLoading] = useState(!hasCachedProfile);
  const [profileData, setProfileData] = useState(cachedOverview?.user || null);
  const [posts, setPosts] = useState(cachedOverview?.posts || []);
  const [quotes, setQuotes] = useState(cachedOverview?.quotes || []);
  const [savedPosts, setSavedPosts] = useState(
    cachedOverview?.savedPosts || []
  );
  const [savedQuotes, setSavedQuotes] = useState(
    cachedOverview?.savedQuotes || []
  );
  const [adminPosts, setAdminPosts] = useState([]);
  const [adminQuotes, setAdminQuotes] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [following, setFollowing] = useState(
    cachedOverview?.user?.following || []
  );
  const [followers, setFollowers] = useState(
    cachedOverview?.user?.followers || []
  );
  const [buddies, setBuddies] = useState(cachedOverview?.user?.buddies || []);
  const [tabIndex, setTabIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewType, setPreviewType] = useState("POST");
  const [previewMuted, setPreviewMuted] = useState(true);
  const [previewFromSaved, setPreviewFromSaved] = useState(false);
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [avatarLayout, setAvatarLayout] = useState(null);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const postCursorRef = useRef(null);
  const hasMorePostsRef = useRef(true);
  const isFetchingMoreRef = useRef(false);
  const hasHydratedProfile = useRef(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [directRooms, setDirectRooms] = useState([]);
  const avatarAnimation = useRef(new Animated.Value(0)).current;
  const avatarRef = useRef(null);
  const avatarImageRef = useRef(null);
  const currentUser = state?.user;
  const currentUserId = currentUser?.id;
  const conversations = useMemo(() => {
    const buddyList = Array.isArray(buddies) ? buddies : [];
    const prompts = [
      "Let's check in later today.",
      "Proud of you for showing up!",
      "How's the day going?",
      "Need a quick accountability chat?",
    ];

    return buddyList.map((buddy, index) => {
      const unreadFlag =
        typeof buddy.unreadMessagesCount === "number"
          ? buddy.unreadMessagesCount > 0
          : buddy.hasUnreadMessages === true;

      return {
        id: buddy.id || `buddy-${index}`,
        user: buddy,
        lastMessage:
          buddy.lastMessage?.text ||
          buddy.lastMessageText ||
          prompts[index % prompts.length],
        lastActivity:
          buddy.lastMessage?.createdAt || Date.now() - index * 45 * 60 * 1000,
        unread: unreadFlag || index === 0,
      };
    });
  }, [buddies]);

  const directRoomCount = useMemo(
    () => (directRooms?.length ? directRooms.length : conversations.length),
    [conversations.length, directRooms?.length]
  );

  const counts = useMemo(() => {
    const likesTotal = posts.reduce(
      (sum, post) => sum + (post?.likesCount || 0),
      0
    );

    const quoteLikesTotal = quotes.reduce(
      (sum, quote) => sum + (quote?.likesCount || 0),
      0
    );

    return {
      following: profileData?.followingCount ?? (following?.length || 0),
      followers: profileData?.followersCount ?? (followers?.length || 0),
      buddies: profileData?.buddiesCount ?? (buddies?.length || 0),
      likes: likesTotal + quoteLikesTotal,
      notifications: notificationCount,
    };
  }, [
    buddies?.length,
    followers?.length,
    following?.length,
    notificationCount,
    posts,
    profileData,
    quotes,
  ]);

  const isAdminUser = profileData?.username === "CandyMan🍭";

  const hasWhy = Boolean(profileData?.whyStatement?.trim());

  useEffect(() => {
    const overviewCount =
      state?.profileOverview?.notificationsCount ??
      state?.profileOverview?.notifications?.length;

    if (typeof overviewCount === "number") {
      setNotificationCount(overviewCount);
    }
  }, [
    state?.profileOverview?.notifications?.length,
    state?.profileOverview?.notificationsCount,
  ]);

  useEffect(() => {
    if (!cachedOverview) return;

    setProfileData(cachedOverview.user || null);
    setPosts(cachedOverview.posts || []);
    setQuotes(cachedOverview.quotes || []);
    setSavedPosts(cachedOverview.savedPosts || []);
    setSavedQuotes(cachedOverview.savedQuotes || []);
    setFollowers(cachedOverview.user?.followers || []);
    setFollowing(cachedOverview.user?.following || []);
    setBuddies(cachedOverview.user?.buddies || []);
    postCursorRef.current = cachedOverview.postCursor || null;
    const cachedHasMore =
      cachedOverview.hasMorePosts ??
      (cachedOverview.posts || []).length >= PROFILE_PAGE_SIZE;
    setHasMorePosts(Boolean(cachedHasMore));
    fetchGuard(hasMorePostsRef, Boolean(cachedHasMore));
    if (!hasHydratedProfile.current) {
      setLoading(false);
      hasHydratedProfile.current = true;
    }
  }, [cachedOverview]);

  useEffect(() => {
    if (!state?.savedState) return;

    setSavedPosts(state.savedState.savedPosts || []);
    setSavedQuotes(state.savedState.savedQuotes || []);
  }, [state?.savedState]);

  const syncProfileOverviewPosts = useCallback(
    (nextPosts, meta = {}) => {
      const currentOverview = state?.profileOverview || {};

      const payload = {
        ...currentOverview,
        ...meta,
        user: profileData || currentOverview.user || state?.user,
        posts: nextPosts,
        quotes: currentOverview.quotes || quotes,
        savedPosts: currentOverview.savedPosts || savedPosts,
        savedQuotes: currentOverview.savedQuotes || savedQuotes,
      };

      dispatch({ type: "SET_PROFILE_OVERVIEW", payload });
    },
    [dispatch, profileData, quotes, savedPosts, savedQuotes, state?.profileOverview, state?.user]
  );

  const mergePosts = useCallback(
    (incomingPosts, { append, meta = {} }) => {
      setPosts((prev) => {
        const merged = dedupeById(append ? [...prev, ...incomingPosts] : incomingPosts);
        syncProfileOverviewPosts(merged, meta);
        return merged;
      });
    },
    [syncProfileOverviewPosts]
  );

  const fetchUserPostsPage = useCallback(
    async ({ append = false } = {}) => {
      const targetUserId = profileData?.id || currentUserId;
      if (!targetUserId) return;

      const cursor = append ? postCursorRef.current : null;
      if (append) {
        if (isFetchingMoreRef.current || !hasMorePostsRef.current) return;
        isFetchingMoreRef.current = true;
        setLoadingMorePosts(true);
      }

      try {
        const token = await getToken();
        if (!token) return;

        const data = await client.request(USER_POSTS_PAGINATED_QUERY, {
          token,
          userId: targetUserId,
          limit: PROFILE_PAGE_SIZE,
          cursor,
        });

        const payload = data?.userPosts;
        const nextPosts = payload?.posts || [];

        const nextCursor = payload?.cursor || null;
        postCursorRef.current = nextCursor;
        const nextHasMore = Boolean(payload?.hasMore);
        setHasMorePosts(nextHasMore);
        fetchGuard(hasMorePostsRef, nextHasMore);
        mergePosts(nextPosts, {
          append,
          meta: { postCursor: nextCursor, hasMorePosts: nextHasMore },
        });
      } catch (err) {
        console.log("Error fetching profile posts", err);
      } finally {
        if (append) {
          isFetchingMoreRef.current = false;
          setLoadingMorePosts(false);
        }
      }
    },
    [
      client,
      currentUserId,
      profileData?.id,
      mergePosts,
    ]
  );

  useEffect(() => {
    fetchGuard(hasMorePostsRef, hasMorePosts);
  }, [hasMorePosts]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const data = await client.request(USER_NOTIFICATIONS_QUERY, { token });
        setNotificationCount((data?.userNotifications || []).length || 0);
      } catch (err) {
        console.log("Error fetching notifications", err);
      }
    };

    fetchNotifications();
  }, [client]);

  useEffect(() => {
    if (!state?.user?.id) return undefined;

    let isMounted = true;

    client
      .request(MY_DIRECT_ROOMS)
      .then((result) => {
        if (!isMounted) return;
        setDirectRooms(result?.myDirectRooms || []);
      })
      .catch((err) => {
        console.log("Error fetching direct rooms", err);
      });

    return () => {
      isMounted = false;
    };
  }, [client, state?.user?.id]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const data = await client.request(PROFILE_OVERVIEW_QUERY, { token });
        const overview = data?.profileOverview;
        setProfileData(overview?.user || null);
        setPosts(overview?.posts || []);
        setQuotes(overview?.quotes || []);
        setSavedPosts(overview?.savedPosts || []);
        setSavedQuotes(overview?.savedQuotes || []);
        setFollowers(overview?.user?.followers || []);
        setFollowing(overview?.user?.following || []);
        setBuddies(overview?.user?.buddies || []);
        postCursorRef.current = overview?.postCursor || null;
        const overviewHasMore =
          overview?.hasMorePosts ?? (overview?.posts || []).length >= PROFILE_PAGE_SIZE;
        setHasMorePosts(Boolean(overviewHasMore));
        fetchGuard(hasMorePostsRef, Boolean(overviewHasMore));

        if (overview) {
          dispatch({ type: "SET_PROFILE_OVERVIEW", payload: overview });
          if (overview.user) {
            dispatch({ type: "SET_USER", payload: overview.user });
          }
        }

        const meData = await client.request(FETCH_ME_QUERY, { token });
        const me = meData?.fetchMe;
        if (me) {
          dispatch({ type: "SET_USER", payload: me });
        }
      } catch (err) {
        console.log("Profile load failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [client, dispatch]);

  useEffect(() => {
    if (!isAdminUser) {
      setAdminPosts([]);
      setAdminQuotes([]);
      return;
    }

    const loadAdminItems = async () => {
      try {
        setAdminLoading(true);
        const token = await getToken();
        if (!token) return;

        const data = await client.request(ADMIN_REVIEW_ITEMS_QUERY, { token });
        setAdminPosts(
          (data?.adminFlaggedPosts || []).map((post) => ({
            ...post,
            __adminItem: true,
          }))
        );
        setAdminQuotes(
          (data?.adminPendingQuotes || []).map((quote) => ({
            ...quote,
            __adminItem: true,
          }))
        );
      } catch (err) {
        console.log("Admin review load failed", err);
      } finally {
        setAdminLoading(false);
      }
    };

    loadAdminItems();
  }, [client, isAdminUser]);

  const handleAvatarLayout = () => {
    if (avatarImageRef.current?.measureInWindow) {
      avatarImageRef.current.measureInWindow((x, y, width, height) => {
        setAvatarLayout({ x, y, width, height });
      });
      return;
    }

    if (avatarRef.current?.measureInWindow) {
      avatarRef.current.measureInWindow((x, y, width, height) => {
        const innerOffset = Math.max(0, (width - AVATAR_SIZE) / 2);
        const innerYOffset = Math.max(0, (height - AVATAR_SIZE) / 2);

        setAvatarLayout({
          x: x + innerOffset,
          y: y + innerYOffset,
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
        });
      });
    }
  };

  const handleOpenAvatar = useCallback(() => {
    if (isAvatarExpanded) return;
    avatarAnimation.setValue(0);
    setIsAvatarExpanded(true);
    requestAnimationFrame(() => {
      Animated.spring(avatarAnimation, {
        toValue: 1,
        useNativeDriver: false,
        tension: 120,
        friction: 12,
      }).start();
    });
  }, [avatarAnimation, isAvatarExpanded]);

  const handleCloseAvatar = useCallback(() => {
    Animated.spring(avatarAnimation, {
      toValue: 0,
      useNativeDriver: false,
      tension: 120,
      friction: 12,
    }).start(() => setIsAvatarExpanded(false));
  }, [avatarAnimation]);

  const avatarPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isAvatarExpanded,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          isAvatarExpanded && Math.abs(gestureState.dy) > 10,
        onPanResponderMove: (_, gestureState) => {
          if (!isAvatarExpanded) return;
          const progress = Math.max(0, Math.min(1, 1 - gestureState.dy / 200));
          avatarAnimation.setValue(progress);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 80) {
            handleCloseAvatar();
            return;
          }

          Animated.spring(avatarAnimation, {
            toValue: 1,
            useNativeDriver: false,
            tension: 120,
            friction: 12,
          }).start();
        },
      }),
    [avatarAnimation, handleCloseAvatar, isAvatarExpanded]
  );

  const renderAvatarOverlay = () => {
    if (!isAvatarExpanded) return null;

    const origin = avatarLayout || {
      x: layout.width / 2 - AVATAR_SIZE / 2,
      y: layout.height * 0.16,
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
    };

    const expandedSize = Math.min(layout.width, layout.height) * 0.72;
    const targetTop = Math.max(24, (layout.height - expandedSize) / 2);
    const targetLeft = (layout.width - expandedSize) / 2;

    const animatedTop = avatarAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [origin.y, targetTop],
    });
    const animatedLeft = avatarAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [origin.x, targetLeft],
    });
    const animatedSize = avatarAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [origin.width, expandedSize],
    });
    const animatedRadius = avatarAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [origin.width / 2, expandedSize / 2],
    });
    const backdropOpacity = avatarAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.7],
    });

    const avatarSource = profileData?.profilePicUrl
      ? { uri: profileData.profilePicUrl }
      : soberLogo;

    return (
      <Animated.View
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
        {...avatarPanResponder.panHandlers}
      >
        <AnimatedBlurView
          intensity={140}
          tint="dark"
          style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
          experimentalBlurMethod="dimezisBlurView"
          reducedTransparencyFallbackColor="rgba(0,0,0,0.6)"
        />

        <Animated.View
          style={[
            styles.avatarOverlay,
            {
              top: animatedTop,
              left: animatedLeft,
              width: animatedSize,
              height: animatedSize,
              borderRadius: animatedRadius,
            },
          ]}
        >
          {profileData?.profilePicUrl ? (
            <Image source={avatarSource} style={styles.avatarOverlayImage} />
          ) : (
            <View style={styles.avatarOverlayPlaceholder}>
              <Feather name="user" size={48} color="#e5e7eb" />
            </View>
          )}
        </Animated.View>

        <Animated.View
          style={[styles.avatarCloseButton, { opacity: avatarAnimation }]}
        >
          <TouchableOpacity
            onPress={handleCloseAvatar}
            style={styles.avatarCloseTouchable}
            activeOpacity={0.8}
          >
            <Feather name="x" size={26} color="#e5e7eb" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  };

  const handleNavigate = (screen) => {
    const commonParams = {
      username: profileData?.username,
      profilePicUrl: profileData?.profilePicUrl,
    };

    switch (screen) {
      case "Following":
        navigation.navigate("Following", {
          ...commonParams,
          users: following || [],
          title: "Following",
          subtitle: "People you're keeping up with",
        });
        break;
      case "Followers":
        navigation.navigate("Followers", {
          ...commonParams,
          users: followers || [],
          title: "Followers",
          subtitle: "Everyone cheering you on",
          buddiesCount: counts.buddies,
        });
        break;
      case "Buddies":
        navigation.navigate("Buddies", {
          ...commonParams,
          users: buddies || [],
          title: "Sober Buddies",
          subtitle: "Your accountability crew",
        });
        break;
      case "Likes":
        navigation.navigate("Likes", {
          ...commonParams,
          likesTotal: counts.likes,
          posts: posts || [],
          quotes: quotes || [],
        });
        break;
      case "Notifications":
        navigation.navigate("Notifications", {
          ...commonParams,
          alerts: state?.notifications || [],
        });
        break;
      default:
        navigation.navigate(screen);
    }
  };

  const openPreview = (item, type = "POST", fromSaved = false) => {
    const authorFallback = profileData
      ? {
          id: profileData.id,
          username: profileData.username,
          profilePicUrl: profileData.profilePicUrl,
          isFollowedByViewer: profileData.isFollowedByViewer,
          isBuddyWithViewer: profileData.isBuddyWithViewer,
        }
      : null;

    const hydratedItem = {
      ...item,
      author: item.author || item.user || authorFallback,
      user: item.user || item.author || authorFallback,
      postAuthor: item.postAuthor || item.author || item.user || authorFallback,
      createdBy: item.createdBy || item.author || item.user || authorFallback,
    };

    setPreviewItem(hydratedItem);
    setPreviewType(type);
    setPreviewFromSaved(fromSaved);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewFromSaved(false);
  };

  const isPreviewSaved = useMemo(() => {
    if (!previewItem?.id) return false;
    return previewType === "POST"
      ? isItemSaved(savedPosts, previewItem.id)
      : isItemSaved(savedQuotes, previewItem.id);
  }, [previewItem?.id, previewType, savedPosts, savedQuotes]);

  const handlePreviewCommentAdded = (newComment) => {
    if (!previewItem) return;
    const targetId = previewItem.id;

    if (previewType === "QUOTE") {
      setQuotes((prev) =>
        prev.map((quote) =>
          quote.id === targetId
            ? {
                ...quote,
                comments: [newComment, ...(quote.comments || [])],
                commentsCount: (quote.commentsCount || 0) + 1,
              }
            : quote
        )
      );
      return;
    }

    setPosts((prev) =>
      prev.map((post) =>
        post.id === targetId
          ? {
              ...post,
              comments: [newComment, ...(post.comments || [])],
              commentsCount: (post.commentsCount || 0) + 1,
            }
          : post
      )
    );

    setSavedPosts((prev) =>
      prev.map((post) =>
        post.id === targetId
          ? {
              ...post,
              comments: [newComment, ...(post.comments || [])],
              commentsCount: (post.commentsCount || 0) + 1,
            }
          : post
      )
    );
  };

  const applyPostPatch = (postId, updater) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? updater(post) : post))
    );
    setSavedPosts((prev) =>
      prev.map((post) => (post.id === postId ? updater(post) : post))
    );
    setPreviewItem((prev) =>
      prev && prev.id === postId ? updater(prev) : prev
    );
  };

  const applyQuotePatch = (quoteId, updater) => {
    setQuotes((prev) =>
      prev.map((quote) => (quote.id === quoteId ? updater(quote) : quote))
    );
    setPreviewItem((prev) =>
      prev && prev.id === quoteId ? updater(prev) : prev
    );
  };

  const syncProfileOverview = (nextSavedPosts, nextSavedQuotes) => {
    const currentOverview = state?.profileOverview || {};
    const payload = {
      ...currentOverview,
      user: profileData || currentOverview.user || state?.user,
      posts,
      quotes,
      savedPosts: nextSavedPosts,
      savedQuotes: nextSavedQuotes,
    };

    dispatch({ type: "SET_PROFILE_OVERVIEW", payload });
  };

  const handleDeleteContent = (contentId, contentType) => {
    if (!contentId) return;

    if (contentType === "QUOTE") {
      setQuotes((prev) => prev.filter((quote) => quote.id !== contentId));
      setSavedQuotes((prev) => prev.filter((quote) => quote.id !== contentId));
      setPreviewItem((prev) => (prev?.id === contentId ? null : prev));
      setPreviewVisible(false);
      return;
    }

    setPosts((prev) => prev.filter((post) => post.id !== contentId));
    setSavedPosts((prev) => prev.filter((post) => post.id !== contentId));
    setPreviewItem((prev) => (prev?.id === contentId ? null : prev));
    setPreviewVisible(false);
  };

  const handleTogglePostLike = async (postId) => {
    if (!postId || !currentUserId) return;

    const token = await getToken();
    if (!token) return;

    const existing =
      posts.find((post) => post.id === postId) ||
      savedPosts.find((post) => post.id === postId) ||
      (previewItem?.id === postId ? previewItem : null);

    const currentlyLiked = (existing?.likes || []).some(
      (like) => like?.user?.id === currentUserId
    );
    const optimisticUser = currentUser || { id: currentUserId };

    const previousPosts = posts;
    const previousSaved = savedPosts;
    const previousPreview = previewItem;

    applyPostPatch(postId, (post) => {
      const filtered = (post.likes || []).filter(
        (like) => like?.user?.id !== currentUserId
      );
      const nextLikes = currentlyLiked
        ? filtered
        : [...filtered, { id: `temp-like-${postId}`, user: optimisticUser }];

      return {
        ...post,
        likesCount: Math.max(
          0,
          (post.likesCount || 0) + (currentlyLiked ? -1 : 1)
        ),
        likes: nextLikes,
      };
    });

    try {
      const data = await client.request(TOGGLE_LIKE_MUTATION, {
        token,
        targetType: "POST",
        targetId: postId,
      });

      const payload = data?.toggleLike;
      if (payload) {
        applyPostPatch(postId, (post) => {
          const actorId = payload.like?.user?.id || currentUserId;
          const filtered = (post.likes || []).filter(
            (like) => like?.user?.id !== actorId
          );
          const nextLikes =
            payload.liked && payload.like
              ? [...filtered, payload.like]
              : filtered;

          return {
            ...post,
            likesCount: payload.likesCount,
            likes: nextLikes,
          };
        });
      }
    } catch (err) {
      console.error("Error toggling post like", err);
      setPosts(previousPosts);
      setSavedPosts(previousSaved);
      setPreviewItem(previousPreview);
    }
  };

  const handleToggleQuoteLike = async (quoteId) => {
    if (!quoteId || !currentUserId) return;

    const token = await getToken();
    if (!token) return;

    const existing =
      quotes.find((quote) => quote.id === quoteId) || previewItem;
    const currentlyLiked = (existing?.likes || []).some(
      (like) => like?.user?.id === currentUserId
    );
    const optimisticUser = currentUser || { id: currentUserId };

    const previousQuotes = quotes;
    const previousPreview = previewItem;

    applyQuotePatch(quoteId, (quote) => {
      const filtered = (quote.likes || []).filter(
        (like) => like?.user?.id !== currentUserId
      );
      const nextLikes = currentlyLiked
        ? filtered
        : [...filtered, { id: `temp-like-${quoteId}`, user: optimisticUser }];

      return {
        ...quote,
        likesCount: Math.max(
          0,
          (quote.likesCount || 0) + (currentlyLiked ? -1 : 1)
        ),
        likes: nextLikes,
      };
    });

    try {
      const data = await client.request(TOGGLE_LIKE_MUTATION, {
        token,
        targetType: "QUOTE",
        targetId: quoteId,
      });

      const payload = data?.toggleLike;
      if (payload) {
        applyQuotePatch(quoteId, (quote) => {
          const actorId = payload.like?.user?.id || currentUserId;
          const filtered = (quote.likes || []).filter(
            (like) => like?.user?.id !== actorId
          );
          const nextLikes =
            payload.liked && payload.like
              ? [...filtered, payload.like]
              : filtered;

          return {
            ...quote,
            likesCount: payload.likesCount,
            likes: nextLikes,
          };
        });
      }
    } catch (err) {
      console.error("Error toggling quote like", err);
      setQuotes(previousQuotes);
      setPreviewItem(previousPreview);
    }
  };

  const handleToggleSave = async (content, contentType = "POST") => {
    if (!content?.id) return;

    const token = await getToken();
    if (!token) return;

    const isPost = contentType === "POST";
    const collection = isPost ? savedPosts : savedQuotes;
    const alreadySaved = isItemSaved(collection, content.id);
    const optimisticSaved = !alreadySaved;

    const applyLocalSave = (nextSaved) => {
      const nextSavedPosts = isPost
        ? nextSaved
          ? mergeSavedList(savedPosts, content)
          : removeSavedItem(savedPosts, content.id)
        : savedPosts;
      const nextSavedQuotes = !isPost
        ? nextSaved
          ? mergeSavedList(savedQuotes, content)
          : removeSavedItem(savedQuotes, content.id)
        : savedQuotes;

      setSavedPosts(nextSavedPosts);
      setSavedQuotes(nextSavedQuotes);

      syncProfileOverview(nextSavedPosts, nextSavedQuotes);

      applySavedStateToContext({
        state,
        dispatch,
        targetType: contentType,
        item: content,
        saved: nextSaved,
      });
    };

    applyLocalSave(optimisticSaved);

    try {
      const data = await client.request(TOGGLE_SAVE_MUTATION, {
        token,
        targetType: contentType,
        targetId: content.id,
      });

      const confirmed = data?.toggleSave?.saved;
      if (typeof confirmed === "boolean" && confirmed !== optimisticSaved) {
        applyLocalSave(confirmed);
      }
    } catch (err) {
      console.error("Error toggling save", err);
      applyLocalSave(alreadySaved);
    }
  };

  const handleFlagForReview = async (postId, alreadyFlagged) => {
    if (!postId) return;
    if (alreadyFlagged) {
      setPreviewItem((prev) =>
        prev && prev.id === postId ? { ...prev } : prev
      );
      return;
    }

    const token = await getToken();
    if (!token) return;

    const previousPosts = posts;
    const previousSaved = savedPosts;
    const previousPreview = previewItem;

    applyPostPatch(postId, (post) => ({
      ...post,
      review: true,
      flagged: true,
    }));

    try {
      const data = await client.request(SET_POST_REVIEW_MUTATION, {
        token,
        postId,
        review: true,
      });

      const updated = data?.setPostReview;
      if (updated) {
        applyPostPatch(postId, (post) => ({
          ...post,
          review: updated.review,
          flagged: updated.flagged,
        }));
      }
    } catch (err) {
      console.error("Error updating review status", err);
      setPosts(previousPosts);
      setSavedPosts(previousSaved);
      setPreviewItem(previousPreview);
    }
  };

  const handleAdminPostModeration = async (postId, approve) => {
    if (!postId) return;

    const token = await getToken();
    if (!token) return;

    try {
      const data = await client.request(MODERATE_POST_MUTATION, {
        token,
        postId,
        approve,
      });

      const updated = data?.moderatePost;
      if (updated) {
        setAdminPosts((prev) => prev.filter((post) => post.id !== postId));
        applyPostPatch(postId, (post) => ({ ...post, ...updated }));
        setPreviewItem((prev) =>
          prev?.id === postId
            ? { ...prev, ...updated, __adminItem: prev.__adminItem }
            : prev
        );
      }
    } catch (err) {
      console.error("Error moderating post", err);
    }
  };

  const handleAdminQuoteModeration = async (quoteId, approve) => {
    if (!quoteId) return;

    const token = await getToken();
    if (!token) return;

    try {
      const data = await client.request(MODERATE_QUOTE_MUTATION, {
        token,
        quoteId,
        approve,
      });

      const updated = data?.moderateQuote;
      if (updated) {
        setAdminQuotes((prev) => prev.filter((quote) => quote.id !== quoteId));
        applyQuotePatch(quoteId, (quote) => ({ ...quote, ...updated }));
        setPreviewItem((prev) =>
          prev?.id === quoteId
            ? { ...prev, ...updated, __adminItem: prev.__adminItem }
            : prev
        );
      }
    } catch (err) {
      console.error("Error moderating quote", err);
    }
  };

  const getViewsCount = (post) => {
    if (!post) return 0;
    if (typeof post.viewsCount === "number") return post.viewsCount;
    return post.video?.viewsCount ?? 0;
  };

  const renderPostTile = ({ item, saved = false, fromSaved = false }) => {
    const isVideo = item.mediaType === "VIDEO";
    const thumbnail = isVideo
      ? item.video?.thumbnailUrl || item.previewUrl || item.imageUrl
      : item.imageUrl || item.previewUrl;
    const imageSource = thumbnail ? { uri: thumbnail } : null;
    const isFlagged = item.flagged;
    const views = getViewsCount(item);

    return (
      <TouchableOpacity
        style={styles.tileWrapper}
        activeOpacity={0.85}
        onPress={() => openPreview(item, "POST", fromSaved)}
      >
        <View style={styles.tile}>
          {imageSource ? (
            <Image source={imageSource} style={styles.tileImage} />
          ) : (
            <View style={[styles.tileImage, styles.tilePlaceholder]}>
              <Feather name="video" size={28} color="#9ca3af" />
            </View>
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent"]}
            style={styles.tileOverlay}
          />
          <View style={styles.tileFooter}>
            <View style={styles.viewsChip}>
              <Ionicons name="eye-outline" size={14} color="#38bdf8" />
              <Text style={styles.viewsText}>{views}</Text>
            </View>
            {saved && <Feather name="bookmark" size={16} color="#fef3c7" />}
          </View>
          {isFlagged && (
            <View style={styles.flaggedBadge}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color="#f87171"
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuoteTile = ({ item, saved = false, fromSaved = false }) => {
    const status = item.isDenied
      ? { label: "Denied", color: "#ef4444", icon: "close-circle" }
      : item.isApproved
      ? { label: "Approved", color: "#10b981", icon: "check-circle" }
      : { label: "Pending", color: "#f59e0b", icon: "clock-outline" };

    return (
      <TouchableOpacity
        style={styles.tileWrapper}
        activeOpacity={0.85}
        onPress={() => openPreview(item, "QUOTE", fromSaved)}
      >
        <View style={[styles.tile, styles.quoteTile]}>
          <View style={styles.quoteHeader}>
            <MaterialCommunityIcons
              name="format-quote-open"
              size={16}
              color="#f59e0b"
            />
            <Text style={styles.quoteBadge}>Quote</Text>
            {saved && (
              <Feather
                name="bookmark"
                size={14}
                color="#fef3c7"
                style={styles.savedQuoteIcon}
              />
            )}
          </View>
          <Text style={styles.quoteText} numberOfLines={3}>
            {item.text}
          </Text>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${status.color}22` },
            ]}
          >
            <MaterialCommunityIcons
              name={status.icon}
              size={14}
              color={status.color}
            />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSavedTile = ({ item }) => {
    if (item.__savedType === "QUOTE") {
      return renderQuoteTile({ item, saved: true, fromSaved: true });
    }

    return renderPostTile({ item, saved: true, fromSaved: true });
  };

  const renderDrunkContent = () => {
    if (!profileData?.drunkPicUrl) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No drunk pic yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.drunkWrapper}>
        <LinearGradient
          colors={["#0ea5e9", "#38bdf8", "#2563eb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.drunkHalo}
        >
          <View style={styles.drunkInner}>
            <Image
              source={{ uri: profileData.drunkPicUrl }}
              style={styles.drunkImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(5,8,22,0.7)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.drunkOverlay}
            >
              <Text style={styles.drunkOverlayText}>
                Back when I used to drink too much
              </Text>
            </LinearGradient>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const savedItems = useMemo(() => {
    const combined = [
      ...(savedPosts || []).map((post) => ({ ...post, __savedType: "POST" })),
      ...(savedQuotes || []).map((quote) => ({
        ...quote,
        __savedType: "QUOTE",
      })),
    ];

    return combined.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  }, [savedPosts, savedQuotes]);

  const renderAdminSection = (title, data, renderer, emptyCopy) => {
    if (!data?.length) {
      return (
        <View style={styles.adminSection}>
          <View style={styles.adminSectionHeader}>
            <Ionicons name="alert-circle" size={18} color="#f59e0b" />
            <Text style={styles.adminSectionTitle}>{title}</Text>
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{emptyCopy}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.adminSection}>
        <View style={styles.adminSectionHeader}>
          <Ionicons name="alert-circle" size={18} color="#f59e0b" />
          <Text style={styles.adminSectionTitle}>{title}</Text>
        </View>
        <FlatList
          data={data}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={renderer}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderAdminContent = () => {
    if (adminLoading) {
      return (
        <View style={styles.adminLoading}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.adminLoadingText}>Refreshing reports…</Text>
        </View>
      );
    }

    return (
      <View>
        {renderAdminSection(
          "Posts needing review",
          adminPosts,
          ({ item }) => renderPostTile({ item }),
          "No flagged or review posts"
        )}
        {renderAdminSection(
          "Quotes awaiting approval",
          adminQuotes,
          renderQuoteTile,
          "No pending quotes"
        )}
      </View>
    );
  };

  const renderContent = (tabType) => {
    if (tabType === "DRUNK") {
      return renderDrunkContent();
    }

    if (tabType === "ADMIN") {
      return renderAdminContent();
    }

    const data =
      tabType === "POSTS" ? posts : tabType === "QUOTES" ? quotes : savedItems;

    if (!data?.length) {
      const emptyCopy =
        tabType === "POSTS"
          ? "No posts yet"
          : tabType === "QUOTES"
          ? "No quotes yet"
          : "No saved posts or quotes yet";
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{emptyCopy}</Text>
        </View>
      );
    }

    const renderer =
      tabType === "QUOTES"
        ? renderQuoteTile
        : tabType === "SAVED"
        ? renderSavedTile
        : ({ item }) => renderPostTile({ item, saved: tabType === "SAVED" });

    return (
      <FlatList
        data={data}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={renderer}
        scrollEnabled={false}
      />
    );
  };

  const renderAvatar = (uri, haloColors) => {
    return (
      <View
        style={styles.avatarContainer}
        ref={avatarRef}
        onLayout={handleAvatarLayout}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={handleOpenAvatar}>
          <LinearGradient colors={haloColors} style={styles.avatarHalo}>
            <View style={styles.avatarInner}>
              {uri ? (
                <Image
                  ref={avatarImageRef}
                  source={{ uri }}
                  style={[styles.avatarImageBase, styles.avatarImage]}
                />
              ) : (
                <View
                  ref={avatarImageRef}
                  style={[
                    styles.avatarImageBase,
                    styles.avatarPlaceholder,
                    styles.avatarImage,
                  ]}
                >
                  <Feather name="user" size={32} color="#9ca3af" />
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const navigateToEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleOpenMessages = () => {
    const initialRooms = directRooms.length ? directRooms : conversations;
    navigation.navigate("Messages", { conversations: initialRooms });
  };

  const tabConfig = useMemo(() => {
    const config = [
      { icon: "signs-post", type: "POSTS" },
      { icon: "format-quote-close", type: "QUOTES" },
      { icon: "bookmark", type: "SAVED" },
      { icon: "wine-bottle", type: "DRUNK" },
    ];

    if (isAdminUser) {
      config.push({ icon: "shield-checkmark", type: "ADMIN" });
    }

    return config.map((tab, index) => ({ ...tab, key: `${index}` }));
  }, [isAdminUser]);

  const routes = useMemo(
    () => tabConfig.map(({ key }) => ({ key })),
    [tabConfig]
  );
  const activeTab = tabConfig[tabIndex]?.type;

  const gridHeight = useMemo(() => {
    if (activeTab === "DRUNK") {
      const haloHeight = layout.width * (4 / 3);
      const paddedHeight = haloHeight + 48; // gradient padding + container spacing
      const drunkHeight = Math.max(520, paddedHeight);
      return profileData?.drunkPicUrl ? drunkHeight : 220;
    }

    const postRows = Math.max(1, Math.ceil(posts.length / 3));
    const quoteRows = Math.max(1, Math.ceil(quotes.length / 3));
    const savedRows = Math.max(1, Math.ceil(savedItems.length / 3));

    const adminPostRows = Math.max(1, Math.ceil(adminPosts.length / 3));
    const adminQuoteRows = Math.max(1, Math.ceil(adminQuotes.length / 3));
    const adminHeight = isAdminUser
      ? adminPostRows * 180 + adminQuoteRows * 180 + 120
      : 0;

    const maxRows = Math.max(postRows, quoteRows, savedRows);
    const baseHeight = maxRows * 180;

    return Math.max(baseHeight, adminHeight);
  }, [
    activeTab,
    layout.width,
    posts.length,
    quotes.length,
    savedItems.length,
    adminPosts.length,
    adminQuotes.length,
    isAdminUser,
    profileData?.drunkPicUrl,
  ]);

  const renderScene = ({ route }) => {
    const tabIdx = Number(route.key);
    const tabType = tabConfig[tabIdx]?.type || "POSTS";
    return <View style={styles.scene}>{renderContent(tabType)}</View>;
  };

  const handleScroll = useCallback(
    ({ nativeEvent }) => {
      const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (
        activeTab === "POSTS" &&
        distanceFromBottom < LOAD_MORE_THRESHOLD &&
        !loadingMorePosts &&
        hasMorePosts
      ) {
        fetchUserPostsPage({ append: true });
      }
    },
    [activeTab, fetchUserPostsPage, hasMorePosts, loadingMorePosts]
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {tabConfig.map((route, i) => {
        const focused = tabIndex === i;
        const color = focused ? "#f59e0b" : "#9ca3af";
        const icon = (() => {
          switch (route.type) {
            case "POSTS":
              return <FontAwesome6 name={route.icon} size={22} color={color} />;
            case "DRUNK":
              return <FontAwesome5 name={route.icon} size={22} color={color} />;
            case "QUOTES":
              return (
                <MaterialCommunityIcons
                  name={route.icon}
                  size={24}
                  color={color}
                />
              );
            case "ADMIN":
              return <Ionicons name={route.icon} size={22} color={color} />;
            default:
              return <Feather name={route.icon} size={22} color={color} />;
          }
        })();
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => setTabIndex(i)}
            activeOpacity={0.8}
          >
            {icon}
            <View
              style={[
                styles.tabIndicator,
                focused && styles.tabIndicatorActive,
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loading && !profileData) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 48 }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={styles.editIconButton}
            onPress={navigateToEditProfile}
          >
            <Feather name="edit-3" size={18} color="#f59e0b" />
          </TouchableOpacity>
        </View>
        <View style={styles.bodyPadding}>
          <View style={styles.headerRow}>
            <View style={styles.avatarColumn}>
              {renderAvatar(profileData?.profilePicUrl, ["#fcd34d", "#f97316"])}
              <View style={styles.usernameRow}>
                <Text style={styles.avatarLabel}>
                  {profileData?.username || "Your name"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <>
              <TouchableOpacity
                style={styles.metric}
                onPress={handleOpenMessages}
                activeOpacity={0.85}
              >
                <View style={styles.metricIconWrapper}>
                  <Ionicons name="chatbubbles" size={18} color="#f59e0b" />
                  {directRoomCount > 0 ? (
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricBadgeText}>{directRoomCount}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.metricLabel}>DM's</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.metric}
                onPress={() => handleNavigate("Following")}
              >
                <Text style={styles.metricValue}>{counts.following}</Text>
                <Text style={styles.metricLabel}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.metric}
                onPress={() => handleNavigate("Followers")}
              >
                <Text style={styles.metricValue}>{counts.followers}</Text>
                <Text style={styles.metricLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.metric}
                onPress={() => handleNavigate("Likes")}
              >
                <Text style={styles.metricValue}>{counts.likes}</Text>
                <Text style={styles.metricLabel}>Likes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.metric}
                onPress={() => handleNavigate("Notifications")}
              >
                <View style={styles.metricIconWrapper}>
                  <Ionicons name="notifications" size={18} color="#f59e0b" />
                  {counts.notifications > 0 ? (
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricBadgeText}>
                        {counts.notifications}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.metricLabel}>Alerts</Text>
              </TouchableOpacity>
            </>
          </View>

          <View style={styles.whyWrapper}>
            <Text style={styles.whyQuoted}>
              “
              {profileData?.whyStatement ||
                "Share a quick reminder of why you chose sobriety. This helps keep you grounded."}
              ”
            </Text>
            <TouchableOpacity
              style={[styles.addWhyButton, hasWhy && styles.changeWhyButton]}
              onPress={() => navigation.navigate("AddWhy")}
            >
              <Feather
                name={hasWhy ? "refresh-cw" : "plus"}
                size={16}
                color={hasWhy ? "#0ea5e9" : "#0b1220"}
              />
              <Text style={[styles.addWhyText, hasWhy && styles.changeWhyText]}>
                {hasWhy ? "Change" : "Add Why"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderTabBar()}

        <View style={styles.tabWrapper}>
          <TabView
            navigationState={{ index: tabIndex, routes }}
            renderScene={renderScene}
            onIndexChange={setTabIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={() => null}
            style={[styles.tabView, { height: gridHeight }]}
            swipeEnabled
            lazy={false}
          />
          {activeTab === "POSTS" && loadingMorePosts ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#f59e0b" />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ContentPreviewModal
        visible={previewVisible}
        item={previewItem}
        type={previewType}
        viewerUser={state?.user}
        onClose={closePreview}
        isMuted={previewMuted}
        onToggleSound={() => setPreviewMuted((prev) => !prev)}
        onCommentAdded={handlePreviewCommentAdded}
        onTogglePostLike={handleTogglePostLike}
        onToggleQuoteLike={handleToggleQuoteLike}
        onToggleSave={handleToggleSave}
        onFlagForReview={handleFlagForReview}
        onDelete={handleDeleteContent}
        onAdminModeratePost={handleAdminPostModeration}
        onAdminModerateQuote={handleAdminQuoteModeration}
        isSaved={isPreviewSaved}
        disableDelete={previewFromSaved}
        hideSaveAction
      />

      {renderAvatarOverlay()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 0,
    paddingTop: 64,
  },
  bodyPadding: {
    paddingHorizontal: 16,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarColumn: {
    alignItems: "center",
    flex: 1,
  },
  topActionsRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  editIconButton: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  metricIconWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  metricBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#f59e0b",
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0b1220",
  },
  metricBadgeText: {
    color: "#0b1220",
    fontSize: 10,
    fontWeight: "800",
  },
  avatarContainer: {
    width: AVATAR_SIZE + 16,
    height: AVATAR_SIZE + 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHalo: {
    width: AVATAR_SIZE + 16,
    height: AVATAR_SIZE + 16,
    borderRadius: (AVATAR_SIZE + 16) / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#0b1220",
    padding: 6,
  },
  avatarImageBase: {
    width: "100%",
    height: "100%",
  },
  avatarImage: {
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlay: {
    position: "absolute",
    backgroundColor: "#0b1220",
    overflow: "hidden",
  },
  avatarOverlayImage: {
    width: "100%",
    height: "100%",
  },
  avatarOverlayPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  avatarCloseButton: {
    position: "absolute",
    top: 38,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 24,
  },
  avatarCloseTouchable: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: "#e5e7eb",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginTop: 8,
  },
  metric: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    color: "#e5e7eb",
    fontWeight: "800",
    fontSize: 16,
  },
  metricLabel: {
    color: "#9ca3af",
    marginTop: 4,
    fontSize: 12,
  },
  whyWrapper: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  whyQuoted: {
    color: "#e5e7eb",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
  addWhyButton: {
    marginTop: 10,
    backgroundColor: "#fcd34d",
    borderWidth: 1,
    borderColor: "#f59e0b",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  addWhyText: {
    color: "#0b1220",
    fontWeight: "700",
    marginLeft: 8,
  },
  changeWhyButton: {
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#0ea5e9",
  },
  changeWhyText: {
    color: "#0ea5e9",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIndicator: {
    height: 2,
    width: "100%",
    marginTop: 8,
    backgroundColor: "transparent",
  },
  tabIndicatorActive: {
    backgroundColor: "#f59e0b",
  },
  tabView: {
    marginHorizontal: 0,
  },
  tabWrapper: {
    position: "relative",
  },
  loadMoreContainer: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scene: {
    flex: 1,
    paddingBottom: 16,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050816",
  },
  tileWrapper: {
    width: "33.333%",
  },
  tile: {
    height: 170,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  tilePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  tileOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tileFooter: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewsChip: {
    backgroundColor: "rgba(17,24,39,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  viewsText: {
    color: "#e5e7eb",
    marginLeft: 4,
    fontSize: 12,
  },
  flaggedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(248,113,113,0.15)",
    borderRadius: 10,
    padding: 4,
  },
  quoteTile: {
    padding: 12,
    justifyContent: "space-between",
    backgroundColor: "#0b1220",
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  quoteBadge: {
    color: "#f59e0b",
    fontWeight: "700",
    marginLeft: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 10,
  },
  savedQuoteIcon: {
    marginLeft: 6,
  },
  quoteText: {
    color: "#e5e7eb",
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 16,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },
  adminSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    marginTop: 12,
  },
  adminSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  adminSectionTitle: {
    color: "#e5e7eb",
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 6,
  },
  adminLoading: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  adminLoadingText: {
    marginTop: 8,
    color: "#e5e7eb",
    fontWeight: "600",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#9ca3af",
  },
  drunkWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  drunkHalo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 18,
    padding: 3,
  },
  drunkInner: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0b1220",
  },
  drunkImage: {
    width: "100%",
    height: "100%",
  },
  drunkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  drunkOverlayText: {
    color: "#e0f2fe",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});

export default ProfileScreen;
