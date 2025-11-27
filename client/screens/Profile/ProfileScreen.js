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
import { TabView } from "react-native-tab-view";

import Context from "../../context";
import { useClient } from "../../client";
import { getToken } from "../../utils/helpers";
import { PROFILE_OVERVIEW_QUERY, FETCH_ME_QUERY } from "../../GraphQL/queries";

const AVATAR_SIZE = 110;

const ProfileScreen = ({ navigation }) => {
  const { dispatch } = useContext(Context);
  const client = useClient();
  const layout = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);

  const counts = useMemo(() => {
    const likesTotal = posts.reduce((sum, post) => sum + (post?.likesCount || 0), 0);

    return {
      following: profileData?.followingCount || 0,
      followers: profileData?.followersCount || 0,
      buddies: profileData?.buddiesCount || 0,
      likes: likesTotal,
      notifications: 0,
    };
  }, [posts, profileData]);

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

  const handleNavigate = (screen) => {
    navigation.navigate(screen);
  };

  const renderPostTile = ({ item, saved = false }) => {
    const thumbnail =
      item.imageUrl || item.video?.thumbnailUrl || item.video?.url || item.previewUrl;
    const imageSource = thumbnail ? { uri: thumbnail } : null;
    const isFlagged = item.flagged;
    const views = item?.video?.viewsCount || 0;

    return (
      <View style={styles.tileWrapper}>
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
              <Ionicons name="eye" size={14} color="#3b82f6" />
              <Text style={styles.viewsText}>{views}</Text>
            </View>
            {saved && <Feather name="bookmark" size={16} color="#fef3c7" />}
          </View>
          {isFlagged && (
            <View style={styles.flaggedBadge}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#f87171" />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderQuoteTile = ({ item }) => {
    const status = item.isDenied
      ? { label: "Denied", color: "#ef4444", icon: "close-circle" }
      : item.isApproved
      ? { label: "Approved", color: "#10b981", icon: "check-circle" }
      : { label: "Pending", color: "#f59e0b", icon: "clock-outline" };

    return (
      <View style={styles.tileWrapper}>
        <View style={[styles.tile, styles.quoteTile]}>
          <Text style={styles.quoteText} numberOfLines={3}>
            {item.text}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: `${status.color}22` }]}>
            <MaterialCommunityIcons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = (tabKey) => {
    const data =
      tabKey === "POSTS"
        ? posts
        : tabKey === "QUOTES"
        ? quotes
        : tabKey === "SAVED"
        ? savedPosts
        : profileData?.drunkPicUrl
        ? [{ id: "drunk", imageUrl: profileData.drunkPicUrl, mediaType: "IMAGE" }]
        : [];

    if (!data?.length) {
      const emptyCopy =
        tabKey === "POSTS"
          ? "No posts yet"
          : tabKey === "QUOTES"
          ? "No quotes yet"
          : tabKey === "SAVED"
          ? "No saved posts yet"
          : "No drunk pic yet";
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{emptyCopy}</Text>
        </View>
      );
    }

    const renderer =
      tabKey === "QUOTES"
        ? renderQuoteTile
        : ({ item }) => renderPostTile({ item, saved: tabKey === "SAVED" });

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
              <Image source={{ uri }} style={[styles.avatarImageBase, styles.avatarImage]} />
            ) : (
              <View style={[styles.avatarImageBase, styles.avatarPlaceholder, styles.avatarImage]}>
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

  const routes = [
    { key: "POSTS", icon: "view-grid" },
    { key: "QUOTES", icon: "format-quote-close" },
    { key: "SAVED", icon: "bookmark" },
    { key: "DRUNK", icon: "glass-mug-variant" },
  ];

  const activeTab = routes[tabIndex]?.key;

  const gridHeight = useMemo(() => {
    const dataLength =
      activeTab === "POSTS"
        ? posts.length
        : activeTab === "QUOTES"
        ? quotes.length
        : activeTab === "SAVED"
        ? savedPosts.length
        : profileData?.drunkPicUrl
        ? 1
        : 0;

    if (!dataLength) return 180;
    const rows = Math.ceil(dataLength / 3);
    return rows * 140;
  }, [activeTab, posts.length, quotes.length, savedPosts.length, profileData?.drunkPicUrl]);

  const renderScene = ({ route }) => (
    <View style={styles.scene}>{renderContent(route.key)}</View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {routes.map((route, i) => {
        const focused = tabIndex === i;
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => setTabIndex(i)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={route.icon}
              size={24}
              color={focused ? "#f59e0b" : "#9ca3af"}
            />
            <View style={[styles.tabIndicator, focused && styles.tabIndicatorActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={styles.headerRow}>
        <View style={styles.avatarColumn}>
          {renderAvatar(profileData?.profilePicUrl, ["#fcd34d", "#f97316"])}
          <View style={styles.usernameRow}>
            <Text style={styles.avatarLabel}>
              {profileData?.username || "Your name"}
            </Text>
            <TouchableOpacity style={styles.usernameEdit} onPress={navigateToEditProfile}>
              <Feather name="edit-3" size={14} color="#f59e0b" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <TouchableOpacity style={styles.metric} onPress={() => handleNavigate("Following")}>
          <Text style={styles.metricValue}>{counts.following}</Text>
          <Text style={styles.metricLabel}>Following</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.metric} onPress={() => handleNavigate("Followers")}>
          <Text style={styles.metricValue}>{counts.followers}</Text>
          <Text style={styles.metricLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.metric} onPress={() => handleNavigate("Buddies")}>
          <Text style={styles.metricValue}>{counts.buddies}</Text>
          <Text style={styles.metricLabel}>Buddies</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.metric} onPress={() => handleNavigate("Likes")}>
          <Text style={styles.metricValue}>{counts.likes}</Text>
          <Text style={styles.metricLabel}>Likes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.metric} onPress={() => handleNavigate("Notifications")}>
          <Ionicons name="notifications" size={18} color="#f59e0b" />
          <Text style={styles.metricLabel}>Alerts</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.whyWrapper}>
        <Text style={styles.whyQuoted}>
          “
          {profileData?.whyStatement ||
            "Share a quick reminder of why you chose sobriety. This helps keep you grounded."}
          ”
        </Text>
        <TouchableOpacity style={styles.addWhyButton} onPress={() => navigation.navigate("AddQuote")}>
          <Feather name="plus" size={16} color="#0b1220" />
          <Text style={styles.addWhyText}>Add Why</Text>
        </TouchableOpacity>
      </View>

      {renderTabBar()}

      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={() => null}
        style={[styles.tabView, { height: gridHeight }]}
        swipeEnabled
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 16,
    paddingTop: 36,
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
  usernameEdit: {
    marginLeft: 8,
    padding: 6,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginTop: 8,
  },
  metric: {
    alignItems: "center",
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
    backgroundColor: "#f59e0b",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  addWhyText: {
    color: "#0b1220",
    fontWeight: "700",
    marginLeft: 8,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 6,
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
    marginHorizontal: -16,
  },
  scene: {
    flex: 1,
    paddingBottom: 16,
  },
  tileWrapper: {
    width: "33.333%",
  },
  tile: {
    height: 140,
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
    padding: 10,
    justifyContent: "space-between",
  },
  quoteText: {
    color: "#e5e7eb",
    fontWeight: "600",
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
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#9ca3af",
  },
});

export default ProfileScreen;
