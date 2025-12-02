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
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import Context from "../../context";
import { useClient } from "../../client";
import { ContentPreviewModal } from "../../components";
import { POST_BY_ID_QUERY, USER_NOTIFICATIONS_QUERY } from "../../GraphQL/queries";
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
  [NotificationTypes.BUDDY_NEAR_BAR]: {
    name: "location",
    color: "#c084fc",
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
    return (
      <Text style={styles.placeholderText}>
        Placeholder until buddy tracking near venues ships.
      </Text>
    );
  }

  return null;
};

const NotificationsScreen = ({ navigation }) => {
  const { state } = useContext(Context);
  const client = useClient();

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewShowComments, setPreviewShowComments] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        setFetchError(null);
        setLoadingNotifications(true);
        const token = await getToken();
        if (!token) {
          if (isMounted) setNotifications([]);
          return;
        }

        const data = await client.request(USER_NOTIFICATIONS_QUERY, { token });
        if (isMounted) {
          setNotifications(data?.userNotifications || []);
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
  }, [client]);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ),
    [notifications]
  );

  const handleMarkOpened = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read: true, opened: true }
          : notification
      )
    );
  }, []);

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

  const handleNotificationPress = useCallback(
    (notification) => {
      if (!notification) return;
      handleMarkOpened(notification.id);

      if (
        notification.intent === NotificationIntents.OPEN_POST_COMMENTS &&
        notification.postId
      ) {
        openPostFromNotification(notification);
      }
    },
    [handleMarkOpened, openPostFromNotification]
  );

  const renderNotification = ({ item }) => {
    const icon = ICONS[item.type] || ICONS[NotificationTypes.COMMENT_ON_POST];
    const actionable =
      item.intent === NotificationIntents.OPEN_POST_COMMENTS && item.postId;

    return (
      <TouchableOpacity
        style={[styles.alertRow, item.read ? null : styles.alertRowUnread]}
        onPress={() => (actionable ? handleNotificationPress(item) : null)}
        accessibilityRole={actionable ? "button" : "text"}
        accessibilityLabel={`${item.title}. ${item.description}`}
        activeOpacity={actionable ? 0.85 : 1}
      >
        <View style={styles.iconBadge}>
          <Ionicons name={icon.name} size={18} color={icon.color} />
        </View>
        <View style={styles.alertCopy}>
          <Text style={styles.alertTitle}>{item.title}</Text>
          <Text style={styles.alertDescription}>{item.description}</Text>
          {formatSubtitle(item)}
        </View>
        {actionable ? (
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        ) : null}
      </TouchableOpacity>
    );
  };

  const handleClosePreview = () => {
    setPreviewContent(null);
    setPreviewShowComments(false);
    setPreviewVisible(false);
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
        <Text style={styles.title}>Notifications</Text>

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
        type="POST"
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
    borderColor: "#f59e0b33",
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
