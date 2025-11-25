// screens/Sober/QuotesScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { GET_QUOTES_QUERY } from "../../GraphQL/queries";
import FeedLayout from "../../components/FeedLayout";
import { useClient } from "../../client";
import AlertModal from "../../components/AlertModal";

// 👇 module-level flag: survives navigation, resets when app reloads
let hasShownQuotesAlertThisSession = false;

const QuotesScreen = () => {
  const client = useClient();
  const isFocused = useIsFocused();

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [containerHeight, setContainerHeight] = useState(null);

  // “Add your own quote” hint
  const [showAlert, setShowAlert] = useState(false);

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

    return (
      <View style={styles.root} onLayout={handleLayout}>
        {renderAlert()}
        <FeedLayout
          caption={handle}
          likesCount={item.likesCount}
          commentsCount={item.commentsCount}
          comments={item.comments}
          avatarUrl={avatarUrl}
        >
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>“{item.text}”</Text>
          </View>
        </FeedLayout>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const handle =
      item.user?.username && item.user.username.trim().length > 0
        ? `@${item.user.username}`
        : "Sober Motivation";

    const avatarUrl = item.user?.profilePicUrl || null;

    return (
      <View style={{ height: containerHeight }}>
        <FeedLayout
          caption={handle}
          likesCount={item.likesCount}
          commentsCount={item.commentsCount}
          comments={item.comments}
          avatarUrl={avatarUrl}
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
});

export default QuotesScreen;
