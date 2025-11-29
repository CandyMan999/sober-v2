import React, { useMemo } from "react";
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

const formatDate = (timestamp) => {
  if (!timestamp) return "Moments ago";
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const LikesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { likesTotal = 0, posts = [], quotes = [], username } = route.params || {};

  const likedItems = useMemo(() => {
    const postItems = (posts || []).map((post) => ({
      id: `post-${post.id}`,
      type: "Post",
      text: post.text || "Shared a post",
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      createdAt: post.createdAt,
      thumbnail: post.imageUrl || post.video?.thumbnailUrl,
    }));

    const quoteItems = (quotes || []).map((quote) => ({
      id: `quote-${quote.id}`,
      type: "Quote",
      text: quote.text || "Shared a quote",
      likes: quote.likesCount || 0,
      comments: quote.commentsCount || 0,
      createdAt: quote.createdAt,
      thumbnail: null,
    }));

    return [...postItems, ...quoteItems].sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }, [posts, quotes]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typePill}>
          <MaterialCommunityIcons
            name={item.type === "Post" ? "image-multiple" : "format-quote-close"}
            size={14}
            color="#0b1220"
          />
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
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={18} color="#f59e0b" />
          <Text style={styles.backText}>Profile</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Likes</Text>
        <Text style={styles.subtitle}>
          {username
            ? `${username}'s content has ${likesTotal} likes so far.`
            : `You've earned ${likesTotal} likes across your posts and quotes.`}
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
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backText: {
    color: "#f59e0b",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
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
