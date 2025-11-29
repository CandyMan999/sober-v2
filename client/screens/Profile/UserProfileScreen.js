import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { TabView } from "react-native-tab-view";

import Avatar from "../../components/Avatar";
import { ContentPreviewModal } from "../../components";
import Context from "../../context";
import { useClient } from "../../client";
import { getToken } from "../../utils/helpers";
import { USER_PROFILE_QUERY } from "../../GraphQL/queries";
import { useOpenSocial } from "../../hooks/useOpenSocial";
import {
  FOLLOW_USER_MUTATION,
  SET_POST_REVIEW_MUTATION,
  TOGGLE_LIKE_MUTATION,
  UNFOLLOW_USER_MUTATION,
} from "../../GraphQL/mutations";
import Toast from "react-native-toast-message";
import { formatDistance, getDistanceFromCoords } from "../../utils/distance";

const AVATAR_SIZE = 110;
const soberLogo = require("../../assets/icon.png");
const SOCIAL_ICON_SIZE = 22;
const SOCIAL_ICON_COLOR = "#e5e7eb";

const SOCIAL_ICON_PROPS = {
  instagram: {
    Component: Ionicons,
    name: "logo-instagram",
    color: SOCIAL_ICON_COLOR,
    size: SOCIAL_ICON_SIZE,
  },
  tiktok: {
    Component: FontAwesome6,
    name: "tiktok",
    color: SOCIAL_ICON_COLOR,
    size: SOCIAL_ICON_SIZE,
  },
  x: { Component: AntDesign, name: "x", color: SOCIAL_ICON_COLOR, size: SOCIAL_ICON_SIZE },
};

const UserProfileScreen = ({ route, navigation }) => {
  const { userId, initialUser } = route.params || {};
  const { state } = useContext(Context);
  const layout = useWindowDimensions();
  const client = useClient();
  const [profileData, setProfileData] = useState(initialUser || null);
  const [posts, setPosts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [following, setFollowing] = useState(initialUser?.following || []);
  const [followers, setFollowers] = useState(initialUser?.followers || []);
  const [buddies, setBuddies] = useState(initialUser?.buddies || []);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [followPending, setFollowPending] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewType, setPreviewType] = useState("POST");
  const [previewMuted, setPreviewMuted] = useState(true);
  const currentUser = state?.user;
  const currentUserId = currentUser?.id;
  const { openSocial } = useOpenSocial();

  const viewerCoords = useMemo(() => {
    if (state?.currentPosition?.lat && state?.currentPosition?.long) {
      return {
        lat: state.currentPosition.lat,
        long: state.currentPosition.long,
      };
    }

    if (state?.user?.lat && state?.user?.long) {
      return {
        lat: state.user.lat,
        long: state.user.long,
      };
    }

    return null;
  }, [state?.currentPosition, state?.user]);

  const distanceLabel = useMemo(() => {
    if (!viewerCoords || !profileData?.lat || !profileData?.long) return null;
    const miles = getDistanceFromCoords(
      viewerCoords.lat,
      viewerCoords.long,
      profileData.lat,
      profileData.long
    );
    return formatDistance(miles);
  }, [viewerCoords, profileData?.lat, profileData?.long]);

  const counts = useMemo(
    () => ({
      following:
        profileData?.followingCount ?? (following?.length || 0),
      followers: profileData?.followersCount ?? (followers?.length || 0),
      buddies: profileData?.buddiesCount ?? (buddies?.length || 0),
    }),
    [followers?.length, following?.length, buddies?.length, profileData]
  );

  const likesTotal = useMemo(() => {
    const postLikes = posts.reduce(
      (sum, post) => sum + (post?.likesCount || 0),
      0
    );

    const quoteLikes = quotes.reduce(
      (sum, quote) => sum + (quote?.likesCount || 0),
      0
    );

    return postLikes + quoteLikes;
  }, [posts, quotes]);

  const tabConfig = useMemo(
    () => [
      { key: "0", icon: "signs-post", type: "POSTS" },
      { key: "1", icon: "format-quote-close", type: "QUOTES" },
      { key: "2", icon: "bookmark", type: "SAVED" },
      { key: "3", icon: "wine-bottle", type: "DRUNK" },
    ],
    []
  );

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
    const savedRows = Math.max(1, Math.ceil(savedPosts.length / 3));

    const maxRows = Math.max(postRows, quoteRows, savedRows);
    return maxRows * 180;
  }, [
    activeTab,
    layout.width,
    posts.length,
    quotes.length,
    savedPosts.length,
    profileData?.drunkPicUrl,
  ]);

  const isFollowed = Boolean(profileData?.isFollowedByViewer);
  const isBuddy = Boolean(profileData?.isBuddyWithViewer);

  const socialLinks = useMemo(() => {
    const social = profileData?.social;
    if (!social) return [];

    const platforms = ["instagram", "tiktok", "x"];

    return platforms
      .map((platform) => {
        const data = social[platform];
        if (!data?.handle) return null;

        const app = data.deeplink?.app || null;
        const web = data.deeplink?.web || data.website || null;

        if (!app && !web) return null;

        return {
          platform,
          data: {
            ...data,
            deeplink: {
              app: app || web,
              web: web || app,
            },
          },
        };
      })
      .filter(Boolean);
  }, [profileData?.social]);

  const handleToggleFollow = useCallback(async () => {
    if (!profileData?.id || profileData?.id === state?.user?.id || followPending)
      return;

    setFollowPending(true);
    try {
      const token = await getToken();
      if (!token) return;

      if (isFollowed) {
        await client.request(UNFOLLOW_USER_MUTATION, { token, userId: profileData.id });
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                isFollowedByViewer: false,
                isBuddyWithViewer: false,
                followersCount: Math.max(0, (prev.followersCount || 1) - 1),
              }
            : prev
        );
      } else {
        const data = await client.request(FOLLOW_USER_MUTATION, {
          token,
          userId: profileData.id,
        });
        const isNowBuddy = Boolean(data?.followUser?.isBuddy);

        if (isNowBuddy) {
          Toast.show({
            type: "info",
            text1: "You're sober accountability buddies",
            text2: `You can DM ${profileData?.username || "this member"} to keep each other on track.`,
            position: "top",
            autoHide: true,
            visibilityTime: 5000,
            topOffset: 80,
          });
        }
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                isFollowedByViewer: true,
                isBuddyWithViewer: isNowBuddy || prev.isBuddyWithViewer,
                followersCount: (prev.followersCount || 0) + 1,
              }
            : prev
        );
      }
    } catch (err) {
      console.log("Follow toggle failed", err);
    } finally {
      setFollowPending(false);
    }
  }, [client, followPending, isFollowed, profileData, state?.user?.id]);

  const handleOpenConnections = (screen) => {
    const commonParams = {
      username: profileData?.username,
      userId: profileData?.id,
      profilePicUrl: profileData?.profilePicUrl,
    };

    switch (screen) {
      case "Following":
        navigation.navigate("Following", {
          ...commonParams,
          users: following || [],
          title: `${profileData?.username || "User"}'s Following`,
          subtitle: "People they're keeping up with",
        });
        break;
      case "Followers":
        navigation.navigate("Followers", {
          ...commonParams,
          users: followers || [],
          title: `${profileData?.username || "User"}'s Followers`,
          subtitle: "Supporters and cheerleaders",
        });
        break;
      case "Buddies":
        navigation.navigate("Buddies", {
          ...commonParams,
          users: buddies || [],
          title: `${profileData?.username || "User"}'s Buddies`,
          subtitle: "Accountability partners",
        });
        break;
      case "Likes":
        navigation.navigate("Likes", {
          ...commonParams,
          likesTotal,
          posts: posts || [],
          quotes: quotes || [],
        });
        break;
      case "Notifications":
        navigation.navigate("Notifications", {
          ...commonParams,
          alerts: [],
        });
        break;
      default:
        break;
    }
  };

  const handleOpenDirectMessage = useCallback(() => {
    if (!profileData?.id || !isBuddy) return;

    navigation.navigate("DirectMessage", {
      user: {
        id: profileData.id,
        username: profileData.username,
        profilePicUrl: profileData.profilePicUrl,
      },
    });
  }, [isBuddy, navigation, profileData]);

  const openPreview = (item, type = "POST") => {
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
    setPreviewVisible(true);
  };

  const closePreview = () => setPreviewVisible(false);

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
    setPosts((prev) => prev.map((post) => (post.id === postId ? updater(post) : post)));
    setSavedPosts((prev) => prev.map((post) => (post.id === postId ? updater(post) : post)));
    setPreviewItem((prev) => (prev && prev.id === postId ? updater(prev) : prev));
  };

  const applyQuotePatch = (quoteId, updater) => {
    setQuotes((prev) => prev.map((quote) => (quote.id === quoteId ? updater(quote) : quote)));
    setPreviewItem((prev) => (prev && prev.id === quoteId ? updater(prev) : prev));
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
      const filtered = (post.likes || []).filter((like) => like?.user?.id !== currentUserId);
      const nextLikes = currentlyLiked
        ? filtered
        : [...filtered, { id: `temp-like-${postId}`, user: optimisticUser }];

      return {
        ...post,
        likesCount: Math.max(0, (post.likesCount || 0) + (currentlyLiked ? -1 : 1)),
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
          const filtered = (post.likes || []).filter((like) => like?.user?.id !== actorId);
          const nextLikes = payload.liked && payload.like ? [...filtered, payload.like] : filtered;

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

    const existing = quotes.find((quote) => quote.id === quoteId) || previewItem;
    const currentlyLiked = (existing?.likes || []).some(
      (like) => like?.user?.id === currentUserId
    );
    const optimisticUser = currentUser || { id: currentUserId };

    const previousQuotes = quotes;
    const previousPreview = previewItem;

    applyQuotePatch(quoteId, (quote) => {
      const filtered = (quote.likes || []).filter((like) => like?.user?.id !== currentUserId);
      const nextLikes = currentlyLiked
        ? filtered
        : [...filtered, { id: `temp-like-${quoteId}`, user: optimisticUser }];

      return {
        ...quote,
        likesCount: Math.max(0, (quote.likesCount || 0) + (currentlyLiked ? -1 : 1)),
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
          const filtered = (quote.likes || []).filter((like) => like?.user?.id !== actorId);
          const nextLikes = payload.liked && payload.like ? [...filtered, payload.like] : filtered;

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

  const handleFlagForReview = async (postId, alreadyFlagged) => {
    if (!postId) return;
    if (alreadyFlagged) {
      setPreviewItem((prev) => (prev && prev.id === postId ? { ...prev } : prev));
      return;
    }

    const token = await getToken();
    if (!token) return;

    const previousPosts = posts;
    const previousSaved = savedPosts;
    const previousPreview = previewItem;

    applyPostPatch(postId, (post) => ({ ...post, review: true, flagged: true }));

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

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const token = await getToken();
        if (!token || !userId) {
          if (mounted) setLoading(false);
          return;
        }

        const data = await client.request(USER_PROFILE_QUERY, { token, userId });
        const overview = data?.userProfile;
        if (!mounted) return;

        setProfileData(overview?.user || initialUser || null);
        setPosts(overview?.posts || []);
        setQuotes(overview?.quotes || []);
        setSavedPosts(overview?.savedPosts || []);
        setFollowers(overview?.user?.followers || []);
        setFollowing(overview?.user?.following || []);
        setBuddies(overview?.user?.buddies || []);
      } catch (err) {
        console.log("User profile load failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [initialUser, userId]);

  const renderPostTile = ({ item, saved = false }) => {
    const isVideo = item.mediaType === "VIDEO";
    const thumbnail = isVideo
      ? item.video?.thumbnailUrl || item.previewUrl || item.imageUrl
      : item.imageUrl || item.previewUrl;
    const imageSource = thumbnail ? { uri: thumbnail } : null;
    const isFlagged = item.flagged;
    const views = item?.video?.viewsCount || 0;
    const key = item?.id || `${thumbnail || "media"}-${saved ? "saved" : "post"}`;

    return (
      <TouchableOpacity
        style={styles.tileWrapper}
        key={key}
        activeOpacity={0.85}
        onPress={() => openPreview(item, "POST")}
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

  const renderQuoteTile = ({ item }) => {
    const status = item.isDenied
      ? { label: "Denied", color: "#ef4444", icon: "close-circle" }
      : item.isApproved
      ? { label: "Approved", color: "#10b981", icon: "check-circle" }
      : { label: "Pending", color: "#f59e0b", icon: "clock-outline" };
    const key = item?.id || item?.text || "quote";

    return (
      <TouchableOpacity
        style={styles.tileWrapper}
        key={key}
        activeOpacity={0.85}
        onPress={() => openPreview(item, "QUOTE")}
      >
        <View style={[styles.tile, styles.quoteTile]}>
          <View style={styles.quoteHeader}>
            <MaterialCommunityIcons
              name="format-quote-open"
              size={16}
              color="#f59e0b"
            />
            <Text style={styles.quoteBadge}>Quote</Text>
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

  const renderDrunkContent = () => {
    if (!profileData?.drunkPicUrl) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No drunk pic yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.drunkContainer}>
        <LinearGradient
          colors={["#0ea5e9", "#38bdf8", "#2563eb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.drunkHalo}
        >
          <View style={styles.drunkImageFrame}>
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

  const renderContent = (type) => {
    const renderers = {
      POSTS: posts.map((item) => renderPostTile({ item })),
      QUOTES: quotes.map((item) => renderQuoteTile({ item })),
      SAVED: savedPosts.map((item) => renderPostTile({ item, saved: true })),
      DRUNK: renderDrunkContent(),
    };

    const content = renderers[type] || renderers.POSTS;

    if (!content || (Array.isArray(content) && content.length === 0)) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nothing here yet</Text>
        </View>
      );
    }

    return <View style={styles.grid}>{content}</View>;
  };

  const renderScene = ({ route }) => {
    const tabIdx = Number(route.key);
    const tabType = tabConfig[tabIdx]?.type || "POSTS";
    return <View style={styles.scene}>{renderContent(tabType)}</View>;
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {tabConfig.map((route, i) => {
        const focused = tabIndex === i;
        const color = focused ? "#f59e0b" : "#9ca3af";
        const icon =
          route.type === "POSTS" ? (
            <FontAwesome6 name={route.icon} size={22} color={color} />
          ) : route.type === "DRUNK" ? (
            <FontAwesome5 name={route.icon} size={22} color={color} />
          ) : (
            <MaterialCommunityIcons name={route.icon} size={22} color={color} />
          );

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
        contentContainerStyle={styles.containerContent}
      >
      <View style={styles.topActionsRow}>
        <View style={styles.editIconWrapper}>
          <TouchableOpacity
            style={styles.editIconButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={20} color="#f59e0b" />
          </TouchableOpacity>
        </View>
        {socialLinks.length ? (
          <View style={styles.socialIconsRow}>
            {socialLinks.map(({ platform, data }) => {
              const icon = SOCIAL_ICON_PROPS[platform];
              const IconComponent = icon?.Component || Ionicons;
              return (
                <TouchableOpacity
                  key={platform}
                  style={styles.socialIconButton}
                  onPress={() => openSocial(platform, data)}
                  activeOpacity={0.85}
                >
                  <IconComponent
                    name={icon?.name || "share-social"}
                    size={icon?.size || 18}
                    color={icon?.color || "#e5e7eb"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>
      <View style={styles.bodyPadding}>
        <View style={styles.headerRow}>
          <View style={styles.avatarColumn}>
            <Avatar
              uri={profileData?.profilePicUrl}
              size={AVATAR_SIZE}
              haloColors={["#fcd34d", "#f97316"]}
              disableNavigation
            />
            <View style={styles.usernameRow}>
              <Text style={styles.avatarLabel}>
                {profileData?.username || "User"}
              </Text>
            </View>
            {profileData?.id !== state?.user?.id ? (
              <View style={styles.profileActionsRow}>
                {isBuddy ? (
                  <TouchableOpacity
                    style={styles.messageButton}
                    onPress={handleOpenDirectMessage}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="chatbubbles"
                      size={18}
                      color="#0b1222"
                      style={styles.messageIcon}
                    />
                    <Text style={styles.messageText}>Message</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isBuddy
                      ? styles.buddyButton
                      : isFollowed
                      ? styles.followingButton
                      : null,
                  ]}
                  onPress={handleToggleFollow}
                  disabled={followPending}
                >
                  <View style={styles.followButtonContent}>
                    <Ionicons
                      name={
                        isBuddy
                          ? "people"
                          : isFollowed
                          ? "checkmark-circle-outline"
                          : "person-add-outline"
                      }
                      size={18}
                      color={
                        isBuddy
                          ? "#0b1222"
                          : isFollowed
                          ? "#e2e8f0"
                          : "#0b1222"
                      }
                      style={styles.followButtonIcon}
                    />
                    <Text
                      style={[
                        styles.followButtonText,
                        isBuddy
                          ? styles.buddyButtonText
                          : isFollowed
                          ? styles.followingButtonText
                          : null,
                      ]}
                    >
                      {followPending
                        ? "..."
                        : isBuddy
                        ? "Buddies"
                        : isFollowed
                        ? "Following"
                        : "Follow"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {(distanceLabel || profileData?.closestCity?.name) && (
          <View style={styles.metaRow}>
            {distanceLabel ? (
              <View style={styles.distancePill}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={18}
                  color="#38bdf8"
                  style={styles.distanceIcon}
                />
                <Text style={styles.distanceText}>{distanceLabel}</Text>
              </View>
            ) : null}
            {profileData?.closestCity?.name ? (
              <View style={styles.cityPill}>
                <Ionicons name="location" size={14} color="#e5e7eb" />
                <Text style={styles.cityText}>{profileData.closestCity.name}</Text>
              </View>
            ) : null}
          </View>
        )}

        <View style={styles.metricsRow}>
          <TouchableOpacity
            style={styles.metric}
            onPress={() => handleOpenConnections("Following")}
          >
            <Text style={styles.metricValue}>{counts.following}</Text>
            <Text style={styles.metricLabel}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metric}
            onPress={() => handleOpenConnections("Followers")}
          >
            <Text style={styles.metricValue}>{counts.followers}</Text>
            <Text style={styles.metricLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metric}
            onPress={() => handleOpenConnections("Buddies")}
          >
            <Text style={styles.metricValue}>{counts.buddies}</Text>
            <Text style={styles.metricLabel}>Buddies</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metric}
            onPress={() => handleOpenConnections("Likes")}
          >
            <Text style={styles.metricValue}>{likesTotal}</Text>
            <Text style={styles.metricLabel}>Likes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.whyWrapper}>
          <Text style={styles.whyQuoted}>
            “
            {profileData?.whyStatement ||
              "This user hasn't shared their why yet."}
            ”
          </Text>
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
        onFlagForReview={handleFlagForReview}
      />
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
  containerContent: {
    paddingBottom: 48,
  },
  bodyPadding: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarColumn: {
    alignItems: "center",
    flex: 1,
  },
  topActionsRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  editIconWrapper: {
    alignItems: "flex-start",
  },
  editIconButton: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  socialIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  socialIconButton: {
    padding: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
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
  metaRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14,165,233,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  distanceIcon: {
    marginTop: 1,
  },
  distanceText: {
    color: "#bae6fd",
    fontWeight: "700",
    fontSize: 12,
  },
  cityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(59,130,246,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cityText: {
    color: "#e5e7eb",
    fontWeight: "600",
    fontSize: 12,
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
  quoteText: {
    color: "#e5e7eb",
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 16,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: "flex-start",
    gap: 4,
  },
  statusText: {
    color: "#e5e7eb",
    fontWeight: "700",
    fontSize: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyState: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontWeight: "600",
  },
  drunkContainer: {
    padding: 12,
  },
  drunkHalo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 18,
    padding: 3,
  },
  drunkImageFrame: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0b1222",
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
  profileActionsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 10,
  },
  followButton: {
    backgroundColor: "#fbbf24",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  followButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  followButtonIcon: {
    marginRight: 6,
  },
  followButtonText: {
    color: "#0b1222",
    fontWeight: "800",
    fontSize: 14,
  },
  messageButton: {
    backgroundColor: "#fde68a",
    borderColor: "#f59e0b",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  messageIcon: {
    marginRight: 6,
  },
  messageText: {
    color: "#0b1222",
    fontWeight: "800",
    fontSize: 14,
  },
  followingButton: {
    backgroundColor: "#0b1222",
    borderColor: "#fbbf24",
  },
  followingButtonText: {
    color: "#e2e8f0",
  },
  buddyButton: {
    backgroundColor: "#22d3ee",
    borderColor: "#0ea5e9",
  },
  buddyButtonText: {
    color: "#0b1222",
  },
});

export default UserProfileScreen;
