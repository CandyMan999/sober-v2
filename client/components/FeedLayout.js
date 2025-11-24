// components/FeedLayout.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import FloatingActionIcons from "./FloatingActionIcons";
import CommentSheet from "./CommentSheet";

const ACCENT = "#F59E0B";

const FeedLayout = ({
  title,
  subtitle,
  caption,
  meta,
  likesCount = 0,
  commentsCount = 0,
  comments = [],
  avatarUrl,
  children,
  onLikePress,
  onMorePress,
  contentStyle,
}) => {
  const [showComments, setShowComments] = useState(false);

  const handleCommentPress = () => {
    setShowComments((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Main content (quote/post/video/etc.) */}
      <View style={[styles.contentArea, contentStyle]}>
        {children ? (
          children
        ) : (
          <>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </>
        )}
      </View>

      {/* Bottom-left: avatar halo + caption/handle */}
      <View style={styles.captionArea}>
        <View style={styles.userRow}>
          {avatarUrl ? (
            <View style={styles.avatarHalo}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            </View>
          ) : null}
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>

      {/* Right-side floating icons with counts */}
      <FloatingActionIcons
        likesCount={likesCount}
        commentsCount={commentsCount}
        onLikePress={onLikePress || (() => {})}
        onCommentPress={handleCommentPress}
        onMorePress={onMorePress || (() => {})}
      />

      {/* Comment sheet (wire to actual comments later) */}
      <CommentSheet
        visible={showComments}
        onClose={handleCommentPress}
        comments={comments}
      />
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
    paddingHorizontal: 24,
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
  },
  captionArea: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 120,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarHalo: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.2)", // soft burnt orange glow
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: ACCENT,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: ACCENT,
    backgroundColor: "#111827",
  },
  caption: {
    color: "#e5e7eb",
    fontSize: 14,
    flexShrink: 1,
  },
  meta: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 4,
  },
});

export default FeedLayout;
