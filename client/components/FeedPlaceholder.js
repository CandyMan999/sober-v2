import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import FloatingActionIcons from "./FloatingActionIcons";
import CommentSheet from "./CommentSheet";

const FeedPlaceholder = ({ title, subtitle, caption, children }) => {
  const [showComments, setShowComments] = useState(false);

  const handleCommentPress = () => {
    setShowComments((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
        {children ? (
          children
        ) : (
          <>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </>
        )}
      </View>

      <View style={styles.captionArea}>
        <Text style={styles.caption}>{caption}</Text>
      </View>

      <FloatingActionIcons
        onLikePress={() => console.log("like")}
        onCommentPress={handleCommentPress}
        onMorePress={() => console.log("more")}
      />

      <CommentSheet visible={showComments} onClose={handleCommentPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  contentArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: "#d1d5db",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  captionArea: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 100,
  },
  caption: {
    color: "#e5e7eb",
    fontSize: 14,
  },
});

export default FeedPlaceholder;
