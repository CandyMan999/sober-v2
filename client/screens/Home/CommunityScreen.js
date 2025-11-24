import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import { FeedLayout } from "../../components";
import { GET_ALL_POSTS } from "../../GraphQL/queries";
import { useClient } from "../../client";

const PAGE_SIZE = 5;

const CommunityScreen = () => {
  const client = useClient();
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [containerHeight, setContainerHeight] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [finishedMap, setFinishedMap] = useState({});

  const videoRefs = useRef({});

  const fetchPosts = useCallback(
    async (append = false) => {
      const nextCursor = append ? cursor : null;

      try {
        if (!append) {
          setLoading(true);
          setError("");
        } else {
          setLoadingMore(true);
        }

        const data = await client.request(GET_ALL_POSTS, {
          limit: PAGE_SIZE,
          cursor: nextCursor,
        });

        const payload = data?.getAllPosts;

        if (!payload) {
          throw new Error("No posts returned");
        }

        setPosts((prev) =>
          append ? [...prev, ...(payload.posts || [])] : payload.posts || []
        );
        setCursor(payload.cursor || null);
        setHasMore(Boolean(payload.hasMore));
      } catch (err) {
        console.error("Error fetching posts", err);
        setError("There was a problem loading the community feed.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [client, cursor]
  );

  useEffect(() => {
    fetchPosts(false);
  }, [fetchPosts]);

  const handleLayout = (e) => {
    const { height } = e.nativeEvent.layout;
    setContainerHeight(height);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchPosts(true);
  };

  const handlePlaybackStatus = useCallback((index, status) => {
    if (!status) return;
    if (status.didJustFinish) {
      setFinishedMap((prev) => ({ ...prev, [index]: true }));
    }
  }, []);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idx, ref]) => {
      const numericIdx = Number(idx);

      if (!ref) return;

      if (numericIdx === activeIndex && !finishedMap[numericIdx]) {
        ref.playAsync && ref.playAsync();
      } else {
        ref.pauseAsync && ref.pauseAsync();
      }
    });
  }, [activeIndex, finishedMap]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!viewableItems?.length) return;
    const index = viewableItems[0].index ?? 0;
    setActiveIndex(index);
    setFinishedMap((prev) => ({ ...prev, [index]: false }));
  });

  const replayVideo = (index) => {
    const ref = videoRefs.current[index];
    if (ref?.replayAsync) {
      ref.replayAsync();
    }
    setFinishedMap((prev) => ({ ...prev, [index]: false }));
    setActiveIndex(index);
  };

  const renderOverlay = (index) => (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.replayButton}
        onPress={() => replayVideo(index)}
        activeOpacity={0.85}
      >
        <Text style={styles.replayText}>Watch again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVideo = (item, index) => (
    <View style={styles.videoWrapper}>
      <Video
        ref={(ref) => {
          if (ref) {
            videoRefs.current[index] = ref;
          }
        }}
        source={{ uri: item.video?.url }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={activeIndex === index && !finishedMap[index]}
        isLooping={false}
        onPlaybackStatusUpdate={(status) => handlePlaybackStatus(index, status)}
      />
      {finishedMap[index] ? renderOverlay(index) : null}
    </View>
  );

  const renderItem = ({ item, index }) => {
    const captionText = item.text || "";
    const avatarUrl = item.author?.profilePicUrl || null;

    return (
      <View style={{ height: containerHeight || 0 }}>
        <FeedLayout
          caption={captionText}
          likesCount={item.likesCount}
          commentsCount={item.commentsCount}
          comments={item.comments}
          avatarUrl={avatarUrl}
          contentStyle={styles.feedContent}
        >
          {renderVideo(item, index)}
        </FeedLayout>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.root} onLayout={handleLayout}>
        <FeedLayout caption="Loading videos...">
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
        <FeedLayout caption="Community">
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </FeedLayout>
      </View>
    );
  }

  if (!posts.length) {
    return (
      <View style={styles.root} onLayout={handleLayout}>
        <FeedLayout caption="Community">
          <View style={styles.center}>
            <Text style={styles.emptyText}>No posts yet. Check back soon.</Text>
          </View>
        </FeedLayout>
      </View>
    );
  }

  if (!containerHeight) {
    return (
      <View style={styles.root} onLayout={handleLayout}>
        <FeedLayout
          caption={posts[0].text || ""}
          likesCount={posts[0].likesCount}
          commentsCount={posts[0].commentsCount}
          comments={posts[0].comments}
          avatarUrl={posts[0].author?.profilePicUrl || null}
          contentStyle={styles.feedContent}
        >
          {renderVideo(posts[0], 0)}
        </FeedLayout>
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <FlatList
        data={posts}
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
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 80 }}
        onViewableItemsChanged={onViewableItemsChanged.current}
        onEndReachedThreshold={0.5}
        onEndReached={handleLoadMore}
        ListFooterComponent={() =>
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color="#f59e0b" />
            </View>
          ) : null
        }
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
  emptyText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#f97373",
    fontSize: 16,
    textAlign: "center",
  },
  feedContent: {
    paddingHorizontal: 0,
  },
  videoWrapper: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
    borderRadius: 12,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  replayButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(245,158,11,0.9)",
    borderRadius: 999,
  },
  replayText: {
    color: "#0b1220",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    paddingVertical: 20,
  },
});

export default CommunityScreen;
