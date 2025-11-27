// screens/Sober/QuotesScreen.js
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  TouchableOpacity,
  Pressable,
  Animated,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { GET_QUOTES_QUERY } from "../../GraphQL/queries";
import FeedLayout from "../../components/FeedLayout";
import { useClient } from "../../client";
import AlertModal from "../../components/AlertModal";
import { TOGGLE_LIKE_MUTATION } from "../../GraphQL/mutations";
import { getToken } from "../../utils/helpers";
import Context from "../../context";

const soberLogo = require("../../assets/icon.png");

// 👇 module-level flag: survives navigation, resets when app reloads
let hasShownQuotesAlertThisSession = false;

const QuotesScreen = () => {
  const client = useClient();
  const isFocused = useIsFocused();
  const { state } = useContext(Context);
  const currentUserId = state?.user?.id;
  const currentUser = state?.user;

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [containerHeight, setContainerHeight] = useState(null);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [saveAnim] = useState(() => new Animated.Value(0));

  // “Add your own quote” hint
  const [showAlert, setShowAlert] = useState(false);

  const isQuoteLiked = useCallback(
    (quote) => {
      if (!currentUserId) return false;
      return (quote?.likes || []).some((like) => like?.user?.id === currentUserId);
    },
    [currentUserId]
  );

  const applyLikePayload = useCallback(
    (quoteId, payload) => {
      if (!payload) return;

      setQuotes((prev) =>
        prev.map((quote) => {
          if (quote.id !== quoteId) return quote;

          const existingLikes = quote.likes || [];
          const actorId = payload.like?.user?.id || currentUserId;
          const filtered = existingLikes.filter((like) => like?.user?.id !== actorId);

          if (payload.liked && payload.like) {
            return {
              ...quote,
              likesCount: payload.likesCount,
              likes: [...filtered, payload.like],
            };
          }

          return {
            ...quote,
            likesCount: payload.likesCount,
            likes: filtered,
          };
        })
      );
    },
    [currentUserId]
  );

  const handleToggleLike = useCallback(
    async (quoteId) => {
      const token = await getToken();
      if (!token) return;

      const previous = quotes.map((quote) => ({
        ...quote,
        likes: quote.likes ? [...quote.likes] : [],
      }));

      const target = quotes.find((quote) => quote.id === quoteId);
      const currentlyLiked = isQuoteLiked(target);

      const optimisticUser = currentUser || { id: currentUserId };

      setQuotes((prev) =>
        prev.map((quote) => {
          if (quote.id !== quoteId) return quote;

          const filtered = (quote.likes || []).filter(
            (like) => like?.user?.id !== currentUserId
          );

          const optimisticLikes = currentlyLiked
            ? filtered
            : [...filtered, { id: `temp-like-${quoteId}`, user: optimisticUser }];

          return {
            ...quote,
            likesCount: Math.max(
              0,
              (quote.likesCount || 0) + (currentlyLiked ? -1 : 1)
            ),
            likes: optimisticLikes,
          };
        })
      );

      try {
        const data = await client.request(TOGGLE_LIKE_MUTATION, {
          token,
          targetType: "QUOTE",
          targetId: quoteId,
        });

        applyLikePayload(quoteId, data?.toggleLike);
      } catch (err) {
        console.error("Error toggling quote like", err);
        setQuotes(previous);
      }
    },
    [applyLikePayload, client, currentUser, currentUserId, isQuoteLiked, quotes]
  );

  const handleCommentAdded = useCallback((quoteId, newComment) => {
    setQuotes((prev) =>
      prev.map((quote) =>
        quote.id === quoteId
          ? {
              ...quote,
              commentsCount: (quote.commentsCount || 0) + 1,
              comments: [newComment, ...(quote.comments || [])],
            }
          : quote
      )
    );
  }, []);

  // Fetch quotes once on mount
  useEffect(() => {
    let isMounted = true;

    const fetchQuotes = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await client.request(GET_QUOTES_QUERY);

        if (!isMounted) return;

        setQuotes(data?.getQuotes || []);
      } catch (err) {
        console.error("Error fetching quotes:", err);
        if (isMounted) {
          setError("There was a problem loading quotes.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchQuotes();

    return () => {
      isMounted = false;
    };
  }, []); // run only once

  // Delay the alert until the screen is fully focused, and only once per session
  useEffect(() => {
    let timeoutId;

    if (isFocused && !hasShownQuotesAlertThisSession) {
      timeoutId = setTimeout(() => {
        setShowAlert(true);
        hasShownQuotesAlertThisSession = true; // 👈 don't show again this session
      }, 800);
    } else if (!isFocused) {
      // hide alert if we leave the screen
      setShowAlert(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isFocused]);

  const handleLayout = (e) => {
    const { height } = e.nativeEvent.layout;
    setContainerHeight(height);
  };

  const openSaveSheet = () => {
    setShowSaveSheet(true);
    Animated.spring(saveAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
      mass: 0.9,
    }).start();
  };

  const closeSaveSheet = () => {
    Animated.spring(saveAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 180,
      mass: 0.9,
    }).start(({ finished }) => {
      if (finished) {
        setShowSaveSheet(false);
      }
    });
  };

  const renderSaveSheet = () => (
    <Modal
      transparent
      animationType="none"
      visible={showSaveSheet}
      onRequestClose={closeSaveSheet}
    >
      <Pressable style={styles.sheetBackdrop} onPress={closeSaveSheet} />
      <View style={styles.sheetContainer}>
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: saveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [140, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sheetTitle}>Quote options</Text>

          <TouchableOpacity style={styles.sheetAction} onPress={closeSaveSheet}>
            <View style={styles.sheetActionLeft}>
              <Ionicons name="bookmark-outline" size={20} color="#fef3c7" />
              <Text style={styles.sheetActionText}>Save</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} onPress={closeSaveSheet}>
            <Text style={styles.sheetCancelText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderAlert = () => (
    <AlertModal
      visible={showAlert}
      type="info"
      title="Share your wisdom ✨"
      message={
        "Tap the + button in the toolbar to add your own quote.\n\nIf it's approved, it can be sent out as a notification to everyone in the Sober Motivation community."
      }
      confirmLabel="Got it"
      onConfirm={() => setShowAlert(false)}
      onCancel={() => setShowAlert(false)}
    />
  );

  if (loading) {
    return (
      <View style={styles.root} onLayout={handleLayout}>
        <FeedLayout caption="Loading quotes...">
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
        <FeedLayout caption="Quotes">
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </FeedLayout>
      </View>
    );
  }

  if (!quotes.length) {
    return (
      <View style={styles.root} onLayout={handleLayout}>
        {renderAlert()}
        <FeedLayout caption="Quotes">
          <View style={styles.center}>
            <Text style={styles.quoteText}>
              No quotes yet. Check back soon.
            </Text>
          </View>
        </FeedLayout>
      </View>
    );
  }

  // Until we know the height, just render first quote without paging
  if (!containerHeight) {
    const item = quotes[0];
    const handle =
      item.user?.username && item.user.username.trim().length > 0
        ? `@${item.user.username}`
        : "Sober Motivation";
    const avatarUrl = item.user?.profilePicUrl || null;
    const fallbackAvatar = !item.user ? soberLogo : null;

    return (
      <View style={styles.root} onLayout={handleLayout}>
        {renderAlert()}
        <FeedLayout
          caption={null}
          commentSheetCaption={`“${item.text}”`}
          likesCount={item.likesCount}
          commentsCount={item.commentsCount}
          comments={item.comments}
          commentTargetType="QUOTE"
          commentTargetId={item.id}
          postAuthor={item.user}
          postCreatedAt={item.createdAt}
          avatarUrl={avatarUrl}
          fallbackAvatarSource={fallbackAvatar}
          authorLabel={handle}
          showFilter={false}
          onMorePress={openSaveSheet}
          isLiked={isQuoteLiked(item)}
          onLikePress={() => handleToggleLike(item.id)}
          onCommentAdded={(newComment) => handleCommentAdded(item.id, newComment)}
        >
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>“{item.text}”</Text>
          </View>
        </FeedLayout>
        {renderSaveSheet()}
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const handle =
      item.user?.username && item.user.username.trim().length > 0
        ? `@${item.user.username}`
        : "Sober Motivation";

    const avatarUrl = item.user?.profilePicUrl || null;
    const fallbackAvatar = !item.user ? soberLogo : null;

    return (
      <View style={{ height: containerHeight }}>
        <FeedLayout
          caption={null}
          commentSheetCaption={`“${item.text}”`}
          likesCount={item.likesCount}
          commentsCount={item.commentsCount}
          comments={item.comments}
          commentTargetType="QUOTE"
          commentTargetId={item.id}
          postAuthor={item.user}
          postCreatedAt={item.createdAt}
          avatarUrl={avatarUrl}
          fallbackAvatarSource={fallbackAvatar}
          authorLabel={handle}
          showFilter={false}
          onMorePress={openSaveSheet}
          isLiked={isQuoteLiked(item)}
          onLikePress={() => handleToggleLike(item.id)}
          onCommentAdded={(newComment) => handleCommentAdded(item.id, newComment)}
        >
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>“{item.text}”</Text>
          </View>
        </FeedLayout>
      </View>
    );
  };

  return (
    <View style={styles.root} onLayout={handleLayout}>
      {renderAlert()}
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        snapToInterval={containerHeight}
        getItemLayout={(_, index) => ({
          length: containerHeight,
          offset: containerHeight * index,
          index,
        })}
      />
      {renderSaveSheet()}
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
  quoteContainer: {
    alignItems: "center",
  },
  quoteText: {
    color: "#fff",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    color: "#f97373",
    fontSize: 16,
    textAlign: "center",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    marginHorizontal: 16,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
  },
  sheetTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  sheetAction: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(30,41,59,0.85)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    marginBottom: 10,
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
  sheetCancel: {
    paddingVertical: 10,
  },
  sheetCancelText: {
    color: "#93c5fd",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default QuotesScreen;
