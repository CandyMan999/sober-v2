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
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  Entypo,
} from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import Context from "../../context";
import { useClient } from "../../client";
import { getToken } from "../../utils/helpers";
import { DELETE_PHOTO_MUTATION } from "../../GraphQL/mutations";
import { PROFILE_OVERVIEW_QUERY, FETCH_ME_QUERY } from "../../GraphQL/queries";

const AVATAR_SIZE = 110;
const DRUNK_WIDTH = 94;
const DRUNK_HEIGHT = 130;

const ContentTabs = createMaterialTopTabNavigator();

const ProfileScreen = ({ navigation }) => {
  const { dispatch } = useContext(Context);
  const client = useClient();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [photoLoading, setPhotoLoading] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const counts = useMemo(() => {
    const likesTotal = posts.reduce(
      (sum, post) => sum + (post?.likesCount || 0),
      0
    );

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

  const handlePhotoAction = async (slot) => {
    try {
      setPhotoLoading(slot);
      const token = await getToken();
      if (!token) return;

      const photoId =
        slot === "PROFILE" ? profileData?.profilePic?.id : profileData?.drunkPic?.id;

      if (!photoId) {
        return;
      }

      await client.request(DELETE_PHOTO_MUTATION, {
        token,
        photoId,
        slot,
      });

      const refreshed = await client.request(PROFILE_OVERVIEW_QUERY, {
        token,
      });

      const overview = refreshed?.profileOverview;
      setProfileData(overview?.user || null);
      setPosts(overview?.posts || []);
      setSavedPosts(overview?.savedPosts || []);
      setQuotes(overview?.quotes || []);
    } catch (err) {
      console.log("Photo delete error", err);
    } finally {
      setPhotoLoading(null);
    }
  };

  const renderPostTile = ({ item, saved = false }) => {
    const imageSource = item.imageUrl ? { uri: item.imageUrl } : null;
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
            {saved && (
              <Feather name="bookmark" size={16} color="#fef3c7" />
            )}
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
      </View>
    );
  };

  const renderContent = (tabKey) => {
    const data =
      tabKey === "POSTS"
        ? posts
        : tabKey === "QUOTES"
        ? quotes
        : savedPosts;

    if (!data?.length) {
      const emptyCopy =
        tabKey === "POSTS"
          ? "No posts yet"
          : tabKey === "QUOTES"
          ? "No quotes yet"
          : "No saved posts yet";
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

  const renderAvatar = (uri, haloColors, isDrunkPic = false) => {
    const containerStyle = isDrunkPic ? styles.drunkContainer : styles.avatarContainer;
    const haloStyle = isDrunkPic ? styles.drunkHalo : styles.avatarHalo;
    const innerStyle = isDrunkPic ? styles.drunkInner : styles.avatarInner;
    const imageStyle = isDrunkPic ? styles.drunkImage : styles.avatarImage;

    return (
      <View style={containerStyle}>
        <LinearGradient colors={haloColors} style={haloStyle}>
          <View style={innerStyle}>
            {uri ? (
              <Image source={{ uri }} style={[styles.avatarImageBase, imageStyle]} />
            ) : (
              <View
                style={[styles.avatarImageBase, styles.avatarPlaceholder, imageStyle]}
              >
                <Feather name="user" size={32} color="#9ca3af" />
              </View>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handlePhotoAction(isDrunkPic ? "DRUNK" : "PROFILE")}
              disabled={photoLoading != null}
            >
              {photoLoading === (isDrunkPic ? "DRUNK" : "PROFILE") ? (
                <ActivityIndicator size="small" color="#fef3c7" />
              ) : (
                <Feather name="trash-2" size={16} color="#fef3c7" />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const activeIconColor = (tab, current) =>
    current === tab ? "#f59e0b" : "#9ca3af";

  const openDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => setDrawerVisible(false);

  const navigateToUsernameEdit = () => {
    const parentNav = navigation.getParent?.();
    parentNav?.navigate("AddUserName") || navigation.navigate("AddUserName");
  };

  const renderDrawer = () => (
    <Modal visible={drawerVisible} transparent animationType="slide">
      <TouchableOpacity
        style={styles.drawerOverlay}
        activeOpacity={1}
        onPress={closeDrawer}
      >
        <TouchableOpacity activeOpacity={1} style={styles.drawerSheet}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Profile Menu</Text>
            <TouchableOpacity onPress={closeDrawer} style={styles.drawerClose}>
              <Feather name="x" size={20} color="#e5e7eb" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => {
              closeDrawer();
              navigation.navigate("NotificationSettings");
            }}
          >
            <Ionicons name="notifications-outline" size={18} color="#f59e0b" />
            <Text style={styles.drawerItemText}>Notification Settings</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderTabSwitch = (currentTab, tabNavigation) => (
    <View style={styles.switchRow}>
      <TouchableOpacity
        style={[styles.switchButton, currentTab === "POSTS" && styles.switchButtonActive]}
        onPress={() => tabNavigation.navigate("POSTS")}
      >
        <MaterialCommunityIcons
          name="view-grid-outline"
          size={20}
          color={activeIconColor("POSTS", currentTab)}
        />
        <Text
          style={[
            styles.switchLabel,
            currentTab === "POSTS" && styles.switchLabelActive,
          ]}
        >
          Posts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.switchButton, currentTab === "QUOTES" && styles.switchButtonActive]}
        onPress={() => tabNavigation.navigate("QUOTES")}
      >
        <MaterialCommunityIcons
          name="format-quote-close"
          size={20}
          color={activeIconColor("QUOTES", currentTab)}
        />
        <Text
          style={[
            styles.switchLabel,
            currentTab === "QUOTES" && styles.switchLabelActive,
          ]}
        >
          Quotes
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.switchButton, currentTab === "SAVED" && styles.switchButtonActive]}
        onPress={() => tabNavigation.navigate("SAVED")}
      >
        <Entypo name="bookmark" size={18} color={activeIconColor("SAVED", currentTab)} />
        <Text
          style={[
            styles.switchLabel,
            currentTab === "SAVED" && styles.switchLabelActive,
          ]}
        >
          Saved
        </Text>
      </TouchableOpacity>
    </View>
  );

  const ProfileTabScene = ({ route, navigation: tabNavigation }) => {
    const currentTab = route.name;

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.drawerButton} onPress={openDrawer}>
            <Feather name="menu" size={20} color="#e5e7eb" />
          </TouchableOpacity>
          <View style={styles.avatarColumn}>
            {renderAvatar(profileData?.profilePicUrl, ["#fcd34d", "#f97316"])}
            <View style={styles.usernameRow}>
              <Text style={styles.avatarLabel}>
                {profileData?.username || "Your name"}
              </Text>
              <TouchableOpacity style={styles.usernameEdit} onPress={navigateToUsernameEdit}>
                <Feather name="edit-3" size={14} color="#f59e0b" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => navigation.navigate("AddPhoto")}
            >
              <Feather name="edit-3" size={14} color="#f59e0b" />
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.avatarColumn}>
            {renderAvatar(profileData?.drunkPicUrl, ["#60a5fa", "#3b82f6"], true)}
            <Text style={styles.avatarLabel}>Drunk Pic</Text>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={() => navigation.navigate("AddPhoto")}
            >
              <Feather name="refresh-ccw" size={14} color="#3b82f6" />
              <Text style={[styles.changeText, { color: "#3b82f6" }]}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metricsRow}>
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
            onPress={() => handleNavigate("Buddies")}
          >
            <Text style={styles.metricValue}>{counts.buddies}</Text>
            <Text style={styles.metricLabel}>Buddies</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.metric} onPress={() => handleNavigate("Likes")}>
            <Text style={styles.metricValue}>{counts.likes}</Text>
            <Text style={styles.metricLabel}>Likes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metric}
            onPress={() => handleNavigate("Notifications")}
          >
            <Ionicons name="notifications" size={18} color="#f59e0b" />
            <Text style={styles.metricLabel}>Alerts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.whyCard}>
          <Text style={styles.sectionTitle}>My Why Statement</Text>
          <Text style={styles.whyText}>
            {profileData?.whyStatement ||
              "Share a quick reminder of why you chose sobriety. This helps keep you grounded."}
          </Text>
          <TouchableOpacity
            style={styles.addWhyButton}
            onPress={() =>
              Alert.alert(
                "Add your why",
                "Create a short statement that keeps you focused on sobriety."
              )
            }
          >
            <Feather name="plus" size={16} color="#0b1220" />
            <Text style={styles.addWhyText}>Add Why</Text>
          </TouchableOpacity>
        </View>

        {renderTabSwitch(currentTab, tabNavigation)}

        <View style={styles.gridContainer}>{renderContent(currentTab)}</View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <>
      <ContentTabs.Navigator
        initialRouteName="POSTS"
        tabBar={() => null}
        screenOptions={{
          swipeEnabled: true,
        }}
      >
        <ContentTabs.Screen name="POSTS" component={ProfileTabScene} />
        <ContentTabs.Screen name="QUOTES" component={ProfileTabScene} />
        <ContentTabs.Screen name="SAVED" component={ProfileTabScene} />
      </ContentTabs.Navigator>
      {renderDrawer()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  drawerButton: {
    position: "absolute",
    right: 0,
    top: -12,
    padding: 10,
    zIndex: 2,
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
  drunkContainer: {
    width: DRUNK_WIDTH + 16,
    height: DRUNK_HEIGHT + 16,
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
  drunkHalo: {
    width: DRUNK_WIDTH + 16,
    height: DRUNK_HEIGHT + 16,
    borderRadius: 22,
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
  drunkInner: {
    width: DRUNK_WIDTH,
    height: DRUNK_HEIGHT,
    borderRadius: 18,
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
  drunkImage: {
    borderRadius: 14,
  },
  avatarPlaceholder: {
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1f2937",
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
    marginTop: 10,
  },
  usernameEdit: {
    marginLeft: 8,
    backgroundColor: "#111827",
    padding: 6,
    borderRadius: 12,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  changeText: {
    color: "#f59e0b",
    marginLeft: 6,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 20,
  },
  metric: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    color: "#f3f4f6",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  whyCard: {
    backgroundColor: "#0b1220",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  whyText: {
    color: "#d1d5db",
    lineHeight: 20,
  },
  addWhyButton: {
    marginTop: 12,
    backgroundColor: "#f59e0b",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  addWhyText: {
    color: "#0b1220",
    fontWeight: "700",
    marginLeft: 8,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#0b1220",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#111827",
    paddingVertical: 10,
    marginBottom: 14,
  },
  switchButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 12,
  },
  switchButtonActive: {
    backgroundColor: "#1f2937",
  },
  switchLabel: {
    marginTop: 6,
    color: "#9ca3af",
    fontWeight: "600",
  },
  switchLabelActive: {
    color: "#f59e0b",
  },
  gridContainer: {
    marginBottom: 32,
  },
  tileWrapper: {
    flex: 1 / 3,
    padding: 4,
  },
  tile: {
    height: 140,
    borderRadius: 12,
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
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  drawerSheet: {
    width: "72%",
    backgroundColor: "#0b1220",
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  drawerTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
  },
  drawerClose: {
    padding: 6,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
  },
  drawerItemText: {
    color: "#e5e7eb",
    marginLeft: 12,
    fontWeight: "600",
  },
});

export default ProfileScreen;
