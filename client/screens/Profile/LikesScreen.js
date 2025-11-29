import React, { useContext, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import Context from "../../context";
import { ContentPreviewModal } from "../../components";

const parseDate = (timestamp) => {
  if (!timestamp) return null;

  if (typeof timestamp === "number") {
    const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
    return new Date(ms);
  }

  const numericValue = Number(timestamp);
  if (!Number.isNaN(numericValue)) {
    const ms = numericValue < 1e12 ? numericValue * 1000 : numericValue;
    return new Date(ms);
  }

  const dateFromString = new Date(timestamp);
  if (!Number.isNaN(dateFromString.getTime())) {
    return dateFromString;
  }

  return null;
};

const formatDate = (timestamp) => {
  const parsed = parseDate(timestamp);
  if (!parsed) return "Moments ago";

  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const LikesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { state } = useContext(Context);
  const {
    likesTotal = 0,
    posts = [],
    quotes = [],
    username,
    profilePicUrl,
  } = route.params || {};
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewType, setPreviewType] = useState("POST");
  const [previewMuted, setPreviewMuted] = useState(true);

  const computedLikesTotal = useMemo(() => {
    const postLikes = posts.reduce((sum, post) => sum + (post?.likesCount || 0), 0);
    const quoteLikes = quotes.reduce(
      (sum, quote) => sum + (quote?.likesCount || 0),
      0
    );

    return postLikes + quoteLikes;
  }, [posts, quotes]);

  const likedItems = useMemo(() => {
    const postItems = (posts || []).map((post) => ({
      id: `post-${post.id}`,
      type: "Post",
      contentType: "POST",
      text: post.text || "Shared a post",
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      createdAt: post.createdAt,
      thumbnail: post.imageUrl || post.video?.thumbnailUrl,
      raw: post,
    }));

    const quoteItems = (quotes || []).map((quote) => ({
      id: `quote-${quote.id}`,
      type: "Quote",
      contentType: "QUOTE",
      text: quote.text || "Shared a quote",
      likes: quote.likesCount || 0,
      comments: quote.commentsCount || 0,
      createdAt: quote.createdAt,
      thumbnail: null,
      raw: quote,
    }));

    return [...postItems, ...quoteItems].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }, [posts, quotes]);

  const handleOpenPreview = (item) => {
    if (!item?.raw) return;

    const raw = item.raw;
    const fallbackPic =
      raw.profilePicUrl ||
      raw?.user?.profilePicUrl ||
      raw?.author?.profilePicUrl ||
      raw?.postAuthor?.profilePicUrl ||
      raw?.createdBy?.profilePicUrl ||
      profilePicUrl ||
      state?.user?.profilePicUrl;

    const displayName =
      raw.author?.username ||
      raw.user?.username ||
      raw.postAuthor?.username ||
      raw.createdBy?.username ||
      raw.username ||
      username ||
      state?.user?.username ||
      "User";

    const authorFallback =
      raw.author ||
      raw.user ||
      raw.postAuthor ||
      raw.createdBy || {
        username: displayName,
        profilePicUrl: fallbackPic,
      };

    const hydratedItem = {
      ...raw,
      author: raw.author || raw.user || authorFallback,
      user: raw.user || raw.author || authorFallback,
      postAuthor: raw.postAuthor || raw.author || raw.user || authorFallback,
      createdBy: raw.createdBy || raw.author || raw.user || authorFallback,
    };

    if (!hydratedItem.author?.profilePicUrl && fallbackPic) {
      hydratedItem.author = { ...hydratedItem.author, profilePicUrl: fallbackPic };
    }
    if (!hydratedItem.user?.profilePicUrl && fallbackPic) {
      hydratedItem.user = { ...hydratedItem.user, profilePicUrl: fallbackPic };
    }
    if (!hydratedItem.postAuthor?.profilePicUrl && fallbackPic) {
      hydratedItem.postAuthor = { ...hydratedItem.postAuthor, profilePicUrl: fallbackPic };
    }
    if (!hydratedItem.createdBy?.profilePicUrl && fallbackPic) {
      hydratedItem.createdBy = { ...hydratedItem.createdBy, profilePicUrl: fallbackPic };
    }

    setPreviewItem(hydratedItem);
    setPreviewType(item.contentType || "POST");
    setPreviewVisible(true);
  };

  const handleClosePreview = () => {
    setPreviewVisible(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleOpenPreview(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typePill}>
          {item.type === "Post" ? (
            <FontAwesome6 name="signs-post" size={14} color="black" />
          ) : (
            <MaterialCommunityIcons name="format-quote-close" size={14} color="#0b1220" />
          )}
          <Text style={styles.typePillText}>{item.type}</Text>
        </View>
        <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
      </View>

      <Text style={styles.cardText} numberOfLines={2}>
        {item.text}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <Ionicons name="heart" size={16} color="#f59e0b" />
          <Text style={styles.metaText}>{item.likes} likes</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="chatbubble-ellipses" size={16} color="#9ca3af" />
          <Text style={styles.metaText}>{item.comments} comments</Text>
        </View>
      </View>

      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={18} color="#f59e0b" />
          </TouchableOpacity>
          <Text style={styles.backText}>Profile</Text>
        </View>

        <Text style={styles.title}>Likes</Text>
        <Text style={styles.subtitle}>
          {username
            ? `${username}'s content has ${computedLikesTotal || likesTotal} likes so far.`
            : `You've earned ${computedLikesTotal || likesTotal} likes across your posts and quotes.`}
        </Text>

      {likedItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons name="heart-circle" size={32} color="#f59e0b" />
          </View>
            <Text style={styles.emptyTitle}>No likes to show</Text>
            <Text style={styles.emptyDescription}>
              Share updates and quotes to start collecting likes from the community.
            </Text>
          </View>
        ) : (
          <FlatList
            data={likedItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 12, gap: 14 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      <ContentPreviewModal
        visible={previewVisible}
        item={previewItem}
        type={previewType}
        viewerUser={state?.user}
        onClose={handleClosePreview}
        isMuted={previewMuted}
        onToggleSound={() => setPreviewMuted((prev) => !prev)}
      />
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
    padding: 24,
    paddingTop: 28,
  },
  headerRow: {
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
  backText: {
    color: "#f3f4f6",
    fontSize: 16,
    fontWeight: "700",
  },
  title: {
    color: "#f3f4f6",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#111827",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  typePillText: {
    color: "#0b1220",
    fontWeight: "800",
  },
  timestamp: {
    color: "#9ca3af",
    fontSize: 12,
  },
  cardText: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "600",
  },
  thumbnail: {
    marginTop: 10,
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  emptyCard: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#111827",
    marginTop: 8,
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
});

export default LikesScreen;
