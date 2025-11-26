// components/FeedLayout.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FloatingActionIcons from "./FloatingActionIcons";
import CommentSheet from "./CommentSheet";

const ACCENT = "#F59E0B";

const FeedLayout = ({
  title,
  subtitle,
  caption,
  commentSheetCaption,
  meta,
  likesCount = 0,
  commentsCount = 0,
  viewsCount = null,
  comments = [],
  postId,
  postCreatedAt,
  postAuthor,
  commentTargetType = "POST",
  commentTargetId,
  avatarUrl,
  cityName,
  onCommentAdded,
  captionStyle,
  children,
  onLikePress,
  isLiked = false,
  onMorePress,
  contentStyle,
  showSoundToggle = false,
  isMuted = false,
  onToggleSound,
  onFilterPress,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isCaptionTruncated, setIsCaptionTruncated] = useState(false);

  const formatCount = (n) => {
    if (typeof n !== "number") return "0";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const handleCaptionLayout = (event) => {
    if (isCaptionTruncated) return;
    const { lines } = event.nativeEvent;
    if (lines?.length > 3) {
      setIsCaptionTruncated(true);
    }
  };

  const toggleCaption = () => {
    if (!isCaptionTruncated) return;
    setIsCaptionExpanded((prev) => !prev);
  };

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

      {/* Bottom-left: avatar + caption + meta */}
      <View style={styles.captionArea}>
        <View style={styles.captionCard}>
          <View style={styles.userRow}>
            {avatarUrl ? (
              <View style={styles.avatarHalo}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              </View>
            ) : null}

            {postAuthor ? (
              <Text style={styles.username} numberOfLines={1}>
                {postAuthor?.username || postAuthor?.name || "Unknown"}
              </Text>
            ) : null}
          </View>

          {caption ? (
            <View style={styles.captionWrapper}>
              <Text
                style={[styles.caption, captionStyle]}
                numberOfLines={isCaptionExpanded ? undefined : 3}
                onTextLayout={handleCaptionLayout}
              >
                {caption}
              </Text>
              {isCaptionTruncated ? (
                <TouchableOpacity onPress={toggleCaption}>
                  <Text style={styles.captionToggle}>
                    {isCaptionExpanded ? "Show less" : "Show more"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {(meta || cityName || typeof viewsCount === "number") && (
            <View style={styles.metaRow}>
              {meta ? <Text style={styles.meta}>{meta}</Text> : null}

              {cityName ? (
                <>
                  {meta ? <Text style={styles.metaDivider}>, </Text> : null}
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#38bdf8"
                      style={styles.metaInlineIcon}
                    />
                    <Text style={[styles.meta, styles.metaEmphasis]}>
                      {cityName}
                    </Text>
                  </View>
                </>
              ) : null}

              {typeof viewsCount === "number" ? (
                <>
                  {(meta || cityName) ? (
                    <Text style={styles.metaDivider}>, </Text>
                  ) : null}
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="eye-outline"
                      size={14}
                      color="#38bdf8"
                      style={styles.metaInlineIcon}
                    />
                    <Text style={[styles.meta, styles.metaEmphasis]}>
                      {`${formatCount(viewsCount)} views`}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          )}
        </View>
      </View>

      {/* Right-side floating icons with counts */}
      <FloatingActionIcons
        likesCount={likesCount}
        commentsCount={commentsCount}
        onLikePress={onLikePress || (() => {})}
        onCommentPress={handleCommentPress}
        onMorePress={onMorePress || (() => {})}
        showSoundToggle={showSoundToggle}
        isMuted={isMuted}
        onToggleSound={onToggleSound}
        isLiked={isLiked}
        onFilterPress={onFilterPress}
      />

      {/* Comment sheet (wire to actual comments later) */}
      <CommentSheet
        visible={showComments}
        onClose={handleCommentPress}
        comments={comments}
        postId={postId}
        targetId={commentTargetId || postId}
        targetType={commentTargetType}
        postCaption={commentSheetCaption ?? caption}
        postAuthor={postAuthor}
        postCreatedAt={postCreatedAt}
        postCityName={cityName}
        totalComments={commentsCount}
        onCommentAdded={onCommentAdded}
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
    bottom: 18,
    left: 16,
    right: 120,
  },
  captionCard: {
    gap: 6,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
  },
  captionWrapper: {
    flexShrink: 1,
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
  username: {
    color: "#e2e8f0",
    fontWeight: "800",
    fontSize: 15,
    maxWidth: "75%",
  },
  caption: {
    color: "#e5e7eb",
    fontSize: 14,
    flexShrink: 1,
  },
  captionToggle: {
    color: "#fbbf24",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 4,
  },
  meta: {
    color: "#cbd5e1",
    fontSize: 13,
    flexShrink: 0,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaInlineIcon: {
    marginRight: 4,
  },
  metaDivider: {
    color: "#38bdf8",
    fontWeight: "700",
    marginHorizontal: 2,
  },
  metaEmphasis: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
});

export default FeedLayout;
