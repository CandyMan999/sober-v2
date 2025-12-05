import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import Context from "../../context";
import { useClient } from "../../client";
import { ContentPreviewModal } from "../../components";
import {
  CLEAR_ALL_NOTIFICATIONS_MUTATION,
  DISMISS_NOTIFICATION_MUTATION,
  MARK_NOTIFICATION_READ_MUTATION,
  POST_BY_ID_QUERY,
  QUOTE_BY_ID_QUERY,
  USER_NOTIFICATIONS_QUERY,
} from "../../GraphQL/queries";
import { getToken } from "../../utils/helpers";
import { NotificationIntents, NotificationTypes } from "../../utils/notifications";

const ICONS = {
  [NotificationTypes.COMMENT_ON_POST]: {
    name: "chatbox-ellipses",
    color: "#60a5fa",
  },
  [NotificationTypes.COMMENT_REPLY]: {
    name: "chatbox-ellipses",
    color: "#60a5fa",
  },
  [NotificationTypes.COMMENT_LIKED]: {
    name: "heart",
    color: "#f472b6",
  },
  [NotificationTypes.FLAGGED_POST]: {
    name: "alert-circle",
    color: "#f59e0b",
  },
  [NotificationTypes.FOLLOWING_NEW_POST]: {
    name: "play-circle",
    color: "#f59e0b",
  },
  [NotificationTypes.NEW_QUOTE]: {
    name: "sparkles",
    color: "#f59e0b",
  },
  [NotificationTypes.BUDDY_NEAR_BAR]: {
    name: "location",
    color: "#c084fc",
  },
  [NotificationTypes.BUDDY_NEAR_LIQUOR]: {
    name: "location",
    color: "#c084fc",
  },
  [NotificationTypes.MILESTONE]: {
    name: "award",
    color: "#f59e0b",
    IconComponent: FontAwesome5,
  },
};

const formatSubtitle = (notification) => {
  if (notification.type === NotificationTypes.FLAGGED_POST) {
    return (
      <Text style={styles.warningText}>
        Inappropriate content can lead to a ban. Please review this post.
      </Text>
    );
  }

  if (notification.type === NotificationTypes.BUDDY_NEAR_BAR) {
    const venueLabel =
      notification.venueType === "LIQUOR_STORE"
        ? "Liquor store"
        : "Bar";
    return (
      <Text style={styles.placeholderText}>
        {`${notification.fromUsername || "A buddy"} was spotted at ${
          notification.venueName || "a venue"
        } (${venueLabel}). Tap to check in.`}
      </Text>
    );
  }

  if (notification.type === NotificationTypes.BUDDY_NEAR_LIQUOR) {
    return (
      <Text style={styles.placeholderText}>
        {`${notification.fromUsername || "A buddy"} was spotted at ${
          notification.venueName || "a venue"
        } (Liquor store). Tap to check in.`}
      </Text>
    );
  }

  return null;
};

const NotificationsScreen = ({ navigation }) => {
  const { state, dispatch } = useContext(Context);
  const client = useClient();

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewType, setPreviewType] = useState("POST");
  const [previewShowComments, setPreviewShowComments] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  const updateNotifications = useCallback((updater) => {
    setNotifications((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        setFetchError(null);
        setLoadingNotifications(true);
        const token = await getToken();
        if (!token) {
          if (isMounted) updateNotifications([]);
          return;
        }

        const data = await client.request(USER_NOTIFICATIONS_QUERY, { token });
        if (isMounted) {
          updateNotifications(
            (data?.userNotifications || []).map((notification) => ({
              ...notification,
              read: Boolean(notification.read),
              dismissed: Boolean(notification.dismissed),
            }))
          );
        }
      } catch (error) {
        console.log("Unable to load notifications", error);
        if (isMounted) setFetchError("Unable to load notifications");
      } finally {
        if (isMounted) setLoadingNotifications(false);
      }
    };

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [client, updateNotifications]);

  const sortedNotifications = useMemo(
    () =>
      [...notifications]
        .filter((notification) => !notification.dismissed)
        .sort((a, b) => {
          if ((a.read ?? false) !== (b.read ?? false)) {
            return a.read ? 1 : -1;
          }

          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }),
    [notifications]
  );

  useEffect(() => {
    const activeCount = notifications.filter((n) => !n.dismissed).length;
    const overview = state?.profileOverview;

    if (!overview) return;
    if (overview.notificationsCount === activeCount) return;

    dispatch({
      type: "SET_PROFILE_OVERVIEW",
      payload: { ...overview, notificationsCount: activeCount },
    });
  }, [dispatch, notifications, state?.profileOverview]);

  const markNotificationRead = useCallback(
    async (id) => {
      if (!id) return;
      updateNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );

      try {
        const token = await getToken();
        if (token) {
          await client.request(MARK_NOTIFICATION_READ_MUTATION, { token, id });
        }
      } catch (error) {
        console.log("Unable to mark notification as read", error);
      }
    },
    [client, updateNotifications]
  );

  const dismissNotification = useCallback(
    async (notification) => {
      if (!notification?.id) return;

      updateNotifications((prev) =>
        prev.filter((item) => item.id !== notification.id && !item.dismissed)
      );

      try {
        const token = await getToken();
        if (token) {
          await client.request(DISMISS_NOTIFICATION_MUTATION, {
            token,
            id: notification.id,
          });
        }
      } catch (error) {
        console.log("Unable to dismiss notification", error);
      }
    },
    [client, updateNotifications]
  );

  const openPostFromNotification = useCallback(
    async (notification) => {
      if (!notification?.postId) return;

      setLoadingPreview(true);
      setPreviewShowComments(
        notification.type === NotificationTypes.COMMENT_ON_POST ||
          notification.type === NotificationTypes.COMMENT_REPLY
      );
      try {
        const token = await getToken();
        const response = await client.request(POST_BY_ID_QUERY, {
          postId: notification.postId,
          token,
          includeFlagged: true,
        });
        const post = response?.post;

        if (post) {
          setPreviewContent(post);
          setPreviewVisible(true);
        }
      } catch (error) {
        console.log("Unable to open post from notification", error);
      } finally {
        setLoadingPreview(false);
      }
    },
    [client]
  );

  const openQuoteFromNotification = useCallback(
    async (notification) => {
      if (!notification?.quoteId) return;

      setLoadingPreview(true);
      setPreviewShowComments(false);

      try {
        const token = await getToken();
        const response = await client.request(QUOTE_BY_ID_QUERY, {
          quoteId: notification.quoteId,
          token,
        });
        const quote = response?.quote;

        if (quote) {
          setPreviewContent(quote);
          setPreviewVisible(true);
        }
      } catch (error) {
        console.log("Unable to open quote from notification", error);
      } finally {
        setLoadingPreview(false);
      }
    },
    [client]
  );

  const handleNotificationPress = useCallback(
    (notification) => {
      if (!notification) return;

      const isBuddyVenueNotification =
        (notification.type === NotificationTypes.BUDDY_NEAR_BAR ||
          notification.type === NotificationTypes.BUDDY_NEAR_LIQUOR) &&
        notification.fromUserId;

      if (isBuddyVenueNotification) {
        const userParam = {
          id: notification.fromUserId,
          username: notification.fromUsername || "Buddy",
          profilePicUrl: notification.fromProfilePicUrl,
        };

        navigation?.navigate?.("DirectMessage", { user: userParam });
        markNotificationRead(notification.id);
        return;
      }

      const isPostNotification =
        notification.intent === NotificationIntents.OPEN_POST_COMMENTS &&
        notification.postId;

      if (isPostNotification) {
        setPreviewType("POST");
        setActiveNotificationId(notification.id);
        openPostFromNotification(notification);
        return;
      }

      const isQuoteNotification =
        notification.type === NotificationTypes.NEW_QUOTE &&
        notification.quoteId;

      if (isQuoteNotification) {
        setPreviewType("QUOTE");
        setActiveNotificationId(notification.id);
        openQuoteFromNotification(notification);
        return;
      }

      const isMilestoneNotification =
        notification.type === NotificationTypes.MILESTONE ||
        notification.intent === NotificationIntents.SHOW_INFO;

      if (isMilestoneNotification) {
        setPreviewType("INFO");
        setPreviewContent({
          id: notification.id,
          title: notification.title,
          text: notification.description,
        });
        setPreviewVisible(true);
        setActiveNotificationId(notification.id);
      }
    },
    [
      markNotificationRead,
      navigation,
      openPostFromNotification,
      openQuoteFromNotification,
    ]
  );

  useEffect(() => {
    if (previewVisible && activeNotificationId) {
      markNotificationRead(activeNotificationId);
    }
  }, [activeNotificationId, markNotificationRead, previewVisible]);

  const renderNotification = ({ item }) => {
    const icon = ICONS[item.type] || ICONS[NotificationTypes.COMMENT_ON_POST];
    const IconComponent = icon.IconComponent || Ionicons;
    const actionable =
      (item.intent === NotificationIntents.OPEN_POST_COMMENTS && item.postId) ||
      (item.type === NotificationTypes.NEW_QUOTE && item.quoteId) ||
      item.type === NotificationTypes.MILESTONE ||
      item.intent === NotificationIntents.SHOW_INFO ||
      (item.intent === NotificationIntents.OPEN_DIRECT_MESSAGE &&
        item.fromUserId);
    const isMilestone = item.type === NotificationTypes.MILESTONE;
    const isBuddyVenueAlert =
      item.type === NotificationTypes.BUDDY_NEAR_BAR ||
      item.type === NotificationTypes.BUDDY_NEAR_LIQUOR;

    return (
      <Swipeable
        renderRightActions={(progress) => (
          <View style={styles.swipeActionsContainer}>
            <Animated.View
              style={[
                styles.swipeActionCard,
                {
                  transform: [
                    {
                      scale: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.swipeAction}
                onPress={() => dismissNotification(item)}
                accessibilityRole="button"
                accessibilityLabel={`Clear ${item.title}`}
              >
                <View style={styles.swipeActionIcon}>
                  <Ionicons name="trash" size={18} color="#fecdd3" />
                </View>
                <Text style={styles.swipeActionText}>Clear</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
        overshootRight={false}
      >
        <TouchableOpacity
          style={[styles.alertRow, item.read ? null : styles.alertRowUnread]}
          onPress={() => (actionable ? handleNotificationPress(item) : null)}
          accessibilityRole={actionable ? "button" : "text"}
          accessibilityLabel={`${item.title}. ${item.description}`}
          activeOpacity={actionable ? 0.85 : 1}
        >
          <View style={styles.iconBadge}>
            <IconComponent name={icon.name} size={18} color={icon.color} />
          </View>
          <View style={styles.alertCopy}>
            <Text style={styles.alertTitle}>{item.title}</Text>
            {!isBuddyVenueAlert ? (
              <Text
                style={styles.alertDescription}
                numberOfLines={isMilestone ? 2 : undefined}
                ellipsizeMode="tail"
              >
                {item.description}
              </Text>
            ) : null}
            {formatSubtitle(item)}
          </View>
          {actionable ? (
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          ) : null}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const handleClearAll = useCallback(async () => {
    const ids = notifications.map((notification) => notification.id);
    if (!ids.length) return;

    setClearingAll(true);
    updateNotifications([]);

    try {
      const token = await getToken();
      if (token) {
        await client.request(CLEAR_ALL_NOTIFICATIONS_MUTATION, { token, ids });
      }
    } catch (error) {
      console.log("Unable to clear all notifications", error);
    } finally {
      setClearingAll(false);
    }
  }, [client, notifications, updateNotifications]);

  const handleClosePreview = () => {
    setPreviewContent(null);
    setPreviewShowComments(false);
    setPreviewVisible(false);
    setActiveNotificationId(null);
    setPreviewType("POST");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
            accessibilityLabel="Go back to profile"
          >
            <Feather name="chevron-left" size={18} color="#f59e0b" />
          </TouchableOpacity>
          <Text style={styles.backLabel}>Profile</Text>
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          {sortedNotifications.length ? (
            <TouchableOpacity
              onPress={handleClearAll}
              disabled={clearingAll}
              style={styles.clearAllButton}
            >
              <View style={styles.clearAllContent}>
                <Ionicons name="trash-outline" size={14} color="#f3f4f6" />
                <Text
                  style={[
                    styles.clearAllText,
                    clearingAll ? styles.clearAllTextDisabled : null,
                  ]}
                >
                  Clear all
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

        {loadingNotifications ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#f59e0b" />
            <Text style={styles.loadingText}>Loading your notifications…</Text>
          </View>
        ) : sortedNotifications.length ? (
          <FlatList
            data={sortedNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="notifications" size={28} color="#f59e0b" />
            </View>
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyDescription}>
              When someone engages with you or an admin flags a post, you'll see it here.
            </Text>
          </View>
        )}
        {fetchError ? (
          <Text style={styles.errorText}>{fetchError}</Text>
        ) : null}
      </View>

      <ContentPreviewModal
        visible={previewVisible && Boolean(previewContent)}
        item={previewContent}
        type={previewType}
        onClose={handleClosePreview}
        onToggleSound={() => {}}
        viewerUser={state?.user}
        initialShowComments={previewShowComments}
        hideSaveAction
      />

      {loadingPreview ? (
        <View style={styles.previewOverlay}>
          <ActivityIndicator color="#f59e0b" />
          <Text style={styles.previewLabel}>Opening post…</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050816",
  },
  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  backButton: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  backLabel: {
    color: "#f3f4f6",
    fontWeight: "700",
  },
  title: {
    color: "#f3f4f6",
    fontSize: 22,
    fontWeight: "700",
  },
  listContent: {
    marginTop: 12,
    paddingBottom: 24,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 10,
  },
  alertRowUnread: {
    borderColor: "#f59e0b66",
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  alertCopy: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "700",
  },
  alertDescription: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 18,
  },
  warningText: {
    color: "#f59e0b",
    fontSize: 12,
  },
  swipeActionsContainer: {
    width: 120,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  swipeActionCard: {
    backgroundColor: "#111827",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    shadowColor: "#ef4444",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  swipeAction: {
    alignItems: "center",
    gap: 2,
  },
  swipeActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  swipeActionText: {
    color: "#fecdd3",
    fontWeight: "800",
    fontSize: 13,
  },
  placeholderText: {
    color: "#c084fc",
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#111827",
    marginTop: 12,
  },
  emptyIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(245,158,11,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#f3f4f6",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyDescription: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingState: {
    marginTop: 16,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  errorText: {
    color: "#f87171",
    marginTop: 8,
    textAlign: "center",
  },
  titleRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  clearAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  clearAllContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clearAllText: {
    color: "#f3f4f6",
    fontWeight: "700",
    fontSize: 12,
  },
  clearAllTextDisabled: {
    color: "#9ca3af",
  },
  previewOverlay: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#0b1220",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#111827",
  },
  previewLabel: {
    color: "#f3f4f6",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default NotificationsScreen;
