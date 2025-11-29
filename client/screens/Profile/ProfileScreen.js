import React, { useContext, useEffect, useMemo, useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { TabView } from "react-native-tab-view";

import Context from "../../context";
import { useClient } from "../../client";
import { getToken } from "../../utils/helpers";
import { PROFILE_OVERVIEW_QUERY, FETCH_ME_QUERY } from "../../GraphQL/queries";
import { TOGGLE_LIKE_MUTATION, SET_POST_REVIEW_MUTATION } from "../../GraphQL/mutations";
import { ContentPreviewModal } from "../../components";

const AVATAR_SIZE = 110;

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
          buddy.lastMessage?.text || buddy.lastMessageText || prompts[index % prompts.length],
        lastActivity: buddy.lastMessage?.createdAt || Date.now() - index * 45 * 60 * 1000,
        unread: unreadFlag || index === 0,
      };
    });
  }, [buddies]);

  const unreadCount = useMemo(
    () => conversations.filter((conversation) => conversation.unread).length,
    [conversations]
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
      following:
        profileData?.followingCount ?? (following?.length || 0),
      followers: profileData?.followersCount ?? (followers?.length || 0),
      buddies: profileData?.buddiesCount ?? (buddies?.length || 0),
      likes: likesTotal + quoteLikesTotal,
      notifications: state?.notifications?.length || 0,
    };
  }, [
    buddies?.length,
    followers?.length,
    following?.length,
    posts,
    profileData,
    quotes,
  ]);

  const hasWhy = Boolean(profileData?.whyStatement?.trim());

  useEffect(() => {
    if (!cachedOverview) return;

    setProfileData(cachedOverview.user || null);
    setPosts(cachedOverview.posts || []);
    setQuotes(cachedOverview.quotes || []);
    setSavedPosts(cachedOverview.savedPosts || []);
    setFollowers(cachedOverview.user?.followers || []);
    setFollowing(cachedOverview.user?.following || []);
    setBuddies(cachedOverview.user?.buddies || []);
    setLoading(false);
  }, []);

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
        setFollowers(overview?.user?.followers || []);
        setFollowing(overview?.user?.following || []);
        setBuddies(overview?.user?.buddies || []);

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
  }, []);

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

  const closePreview = () => {
    setPreviewVisible(false);
  };

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

  const renderPostTile = ({ item, saved = false }) => {
    const isVideo = item.mediaType === "VIDEO";
    const thumbnail = isVideo
      ? item.video?.thumbnailUrl || item.previewUrl || item.imageUrl
      : item.imageUrl || item.previewUrl;
    const imageSource = thumbnail ? { uri: thumbnail } : null;
    const isFlagged = item.flagged;
    const views = item?.video?.viewsCount || 0;

    return (
      <TouchableOpacity
        style={styles.tileWrapper}
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

    return (
      <TouchableOpacity
        style={styles.tileWrapper}
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

  const renderContent = (tabType) => {
    if (tabType === "DRUNK") {
      return renderDrunkContent();
    }

    const data =
      tabType === "POSTS" ? posts : tabType === "QUOTES" ? quotes : savedPosts;

    if (!data?.length) {
      const emptyCopy =
        tabType === "POSTS"
          ? "No posts yet"
          : tabType === "QUOTES"
          ? "No quotes yet"
          : "No saved posts yet";
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{emptyCopy}</Text>
        </View>
      );
    }

    const renderer =
      tabType === "QUOTES"
        ? renderQuoteTile
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
      <View style={styles.avatarContainer}>
        <LinearGradient colors={haloColors} style={styles.avatarHalo}>
          <View style={styles.avatarInner}>
            {uri ? (
              <Image
                source={{ uri }}
                style={[styles.avatarImageBase, styles.avatarImage]}
              />
            ) : (
              <View
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
      </View>
    );
  };

  const navigateToEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleOpenMessages = () => {
    navigation.navigate("Messages", { conversations });
  };

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
          ) : route.type === "QUOTES" ? (
            <MaterialCommunityIcons name={route.icon} size={24} color={color} />
          ) : (
            <Feather name={route.icon} size={22} color={color} />
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
        contentContainerStyle={{ paddingBottom: 48 }}
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
                  <Ionicons name="chatbubbles" size={20} color="#f59e0b" />
                  {unreadCount > 0 ? (
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricBadgeText}>{unreadCount}</Text>
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
                  <Ionicons name="notifications" size={20} color="#f59e0b" />
                  {counts.notifications > 0 ? (
                    <View style={styles.metricBadge}>
                      <Text style={styles.metricBadgeText}>{counts.notifications}</Text>
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
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  metricBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#f59e0b",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
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
