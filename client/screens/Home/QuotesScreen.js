// screens/Sober/QuotesScreen.js
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
  ActivityIndicator,
  FlatList,
  Modal,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { GET_QUOTES_QUERY } from "../../GraphQL/queries";
import { FeedLayout, QuoteFeedLayout } from "../../components";
import { useClient } from "../../client";
import AlertModal from "../../components/AlertModal";
import Context from "../../context";
import FeedInteractionModel from "../../utils/feed/FeedInteractionModel";
import { TOGGLE_SAVE_MUTATION } from "../../GraphQL/mutations";
import { applySavedStateToContext, isItemSaved } from "../../utils/saves";
import { getToken } from "../../utils/helpers";

// 👇 module-level flag: survives navigation, resets when app reloads
let hasShownQuotesAlertThisSession = false;

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * 0.26);

const QuotesScreen = () => {
  const client = useClient();
  const isFocused = useIsFocused();
  const { state, dispatch } = useContext(Context);
  const currentUserId = state?.user?.id;
  const currentUser = state?.user;

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [containerHeight, setContainerHeight] = useState(null);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [savingQuoteId, setSavingQuoteId] = useState(null);
  const [saveAnim] = useState(() => new Animated.Value(0));

  // “Add your own quote” hint
  const [showAlert, setShowAlert] = useState(false);
  const [followLoadingIds, setFollowLoadingIds] = useState(new Set());

  const quotesRef = useRef(quotes);
  const followLoadingRef = useRef(followLoadingIds);

  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

  useEffect(() => {
    followLoadingRef.current = followLoadingIds;
  }, [followLoadingIds]);

  const getQuotes = useCallback(() => quotesRef.current, []);
  const getFollowLoading = useCallback(() => followLoadingRef.current, []);

  const feedModel = useMemo(
    () =>
      new FeedInteractionModel({
        client,
        currentUser,
        currentUserId,
        getItems: getQuotes,
        setItems: setQuotes,
        authorKey: "user",
        targetType: "QUOTE",
        itemLabel: "quote",
        getLoadingUserIds: getFollowLoading,
        setLoadingUserIds: setFollowLoadingIds,
      }),
    [
      client,
      currentUser,
      currentUserId,
      getFollowLoading,
      getQuotes,
      setFollowLoadingIds,
      setQuotes,
    ]
  );

  const handleToggleLike = useCallback(
    async (quoteId) => feedModel.toggleLike(quoteId),
    [feedModel]
  );

  const handleToggleFollowUser = useCallback(
    async (author) => feedModel.toggleFollow(author),
    [feedModel]
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

  const openSaveSheet = (quote) => {
    setSelectedQuote(quote || null);
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
        setSelectedQuote(null);
      }
    });
  };

  const translateY = saveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT + 60, 0],
  });

  const handleToggleSaveQuote = async () => {
    if (!selectedQuote?.id) return;

    const token = await getToken();
    if (!token) return;

    const alreadySaved = isItemSaved(
      state?.user?.savedQuotes,
      selectedQuote.id
    );
    const optimisticSaved = !alreadySaved;
    setSavingQuoteId(selectedQuote.id);

    applySavedStateToContext({
      state,
      dispatch,
      targetType: "QUOTE",
      item: selectedQuote,
      saved: optimisticSaved,
    });

    try {
      const data = await client.request(TOGGLE_SAVE_MUTATION, {
        token,
        targetType: "QUOTE",
        targetId: selectedQuote.id,
      });

      const confirmed = data?.toggleSave?.saved;
      if (typeof confirmed === "boolean" && confirmed !== optimisticSaved) {
        applySavedStateToContext({
          state,
          dispatch,
          targetType: "QUOTE",
          item: selectedQuote,
          saved: confirmed,
        });
      }
    } catch (err) {
      console.error("Error toggling quote save", err);
      applySavedStateToContext({
        state,
        dispatch,
        targetType: "QUOTE",
        item: selectedQuote,
        saved: alreadySaved,
      });
    } finally {
      setSavingQuoteId(null);
      closeSaveSheet();
    }
  };

  const renderSaveSheet = () => {
    const selectedQuoteId = selectedQuote?.id;

    return (
      <Modal
        transparent
        animationType="none"
        visible={showSaveSheet}
        onRequestClose={closeSaveSheet}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.sheetBackdrop} onPress={closeSaveSheet} />
          <Animated.View
            style={[styles.bottomSheet, { transform: [{ translateY }] }]}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>More options</Text>
              <TouchableOpacity
                onPress={closeSaveSheet}
                accessibilityRole="button"
                accessibilityLabel="Close options"
                style={styles.sheetCloseButton}
              >
                <Ionicons name="close-circle" size={32} color="#e5e7eb" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sheetAction}
              onPress={handleToggleSaveQuote}
              disabled={!selectedQuoteId || savingQuoteId === selectedQuoteId}
            >
              <View style={styles.sheetActionLeft}>
                <Ionicons name="bookmark-outline" size={20} color="#fef3c7" />
                <Text style={styles.sheetActionText}>
                  {selectedQuoteId &&
                  isItemSaved(state?.user?.savedQuotes, selectedQuoteId)
                    ? "Unsave"
                    : "Save"}
                </Text>
              </View>
              {savingQuoteId === selectedQuoteId ? (
                <ActivityIndicator
                  color="#f59e0b"
                  size="small"
                  style={styles.sheetSpinner}
                />
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  };

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

    return (
      <View style={styles.root} onLayout={handleLayout}>
        {renderAlert()}
        <QuoteFeedLayout
          quote={item}
          isLiked={feedModel.isItemLiked(item)}
          onLikePress={() => handleToggleLike(item.id)}
          onCommentAdded={(newComment) =>
            handleCommentAdded(item.id, newComment)
          }
          onToggleFollow={
            item.user?.id ? () => handleToggleFollowUser(item.user) : undefined
          }
          viewerUserId={currentUserId}
          onMorePress={() => openSaveSheet(item)}
        />
        {renderSaveSheet()}
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={{ height: containerHeight }}>
      <QuoteFeedLayout
        quote={item}
        isLiked={feedModel.isItemLiked(item)}
        onLikePress={() => handleToggleLike(item.id)}
        onCommentAdded={(newComment) => handleCommentAdded(item.id, newComment)}
        onToggleFollow={
          item.user?.id ? () => handleToggleFollowUser(item.user) : undefined
        }
        viewerUserId={currentUserId}
        onMorePress={() => openSaveSheet(item)}
      />
    </View>
  );

  return (
    <View style={styles.root} onLayout={handleLayout}>
      {renderAlert()}
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="always"
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
  modalContainer: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sheetTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "700",
  },
  sheetCloseButton: {
    padding: 0,
    marginLeft: 8,
    marginTop: -10,
  },
  sheetAction: {
    paddingVertical: 14,
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
  sheetSpinner: {
    marginLeft: 8,
  },
});

export default QuotesScreen;
