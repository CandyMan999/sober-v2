// components/FeedLayout.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "./Avatar";
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
  fallbackAvatarSource,
  authorLabel,
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
  showFilter = true,
  isMilestonePost = false,
  isVideoPost = false,
  onToggleFollow,
  isFollowed = false,
  isBuddy = false,
  viewerUserId,
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

  const displayName =
    authorLabel ||
    (postAuthor
      ? `@${postAuthor?.username || postAuthor?.name || "Unknown"}`
      : null);

  const resolvedAvatarUrl =
    avatarUrl || postAuthor?.profilePicUrl || postAuthor?.profilePic?.url || null;

  const canFollow =
    Boolean(onToggleFollow) &&
    Boolean(postAuthor?.id) &&
    Boolean(viewerUserId) &&
    postAuthor?.id !== viewerUserId;

  const hasViews = typeof viewsCount === "number";
  const metaItems = [];

  if (meta) {
    metaItems.push({ key: "meta", type: "text", value: meta });
  }

  if (cityName) {
    metaItems.push({ key: "city", type: "city", value: cityName });
  }

  if (hasViews) {
    metaItems.push({
      key: "views",
      type: "views",
      value: `${formatCount(viewsCount)} views`,
    });
  }

  const useDotSeparators = isVideoPost || isMilestonePost;

  const renderMetaItem = (item, showDivider) => (
    <React.Fragment key={item.key}>
      {showDivider ? <Text style={styles.metaDivider}>•</Text> : null}
      {item.type === "text" ? (
        <Text style={styles.meta} numberOfLines={1}>
          {item.value}
        </Text>
      ) : (
        <View style={styles.metaItem}>
          <Ionicons
            name={item.type === "city" ? "location-outline" : "eye-outline"}
            size={14}
            color="#38bdf8"
            style={styles.metaInlineIcon}
          />
          <Text style={[styles.meta, styles.metaEmphasis]} numberOfLines={1}>
            {item.value}
          </Text>
        </View>
      )}
    </React.Fragment>
  );

  const renderMetaRow = () => {
    if (!metaItems.length) return null;

    if (isMilestonePost && hasViews) {
      const leftItems = metaItems.filter((item) => item.type !== "views");
      const viewsItem = metaItems.find((item) => item.type === "views");

      return (
        <View style={[styles.metaRow, styles.milestoneMetaRow]}>
          <View style={styles.metaLeftGroup}>
            {leftItems.map((item, index) =>
              renderMetaItem(item, useDotSeparators && index > 0)
            )}
          </View>

          {viewsItem ? (
            <View style={styles.metaRightItem}>
              {renderMetaItem(viewsItem, useDotSeparators)}
            </View>
          ) : null}
        </View>
      );
    }

    return (
      <View style={styles.metaRow}>
        {metaItems.map((item, index) =>
          renderMetaItem(item, useDotSeparators && index > 0)
        )}
      </View>
    );
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

      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        locations={[0, 1]}
        style={styles.bottomGradient}
      />

      {/* Bottom-left: avatar + caption + meta */}
      <View style={styles.captionArea}>
        <View style={styles.captionCard}>
          <View style={styles.userRow}>
            <Avatar
              uri={resolvedAvatarUrl}
              fallbackSource={fallbackAvatarSource}
              haloColor={resolvedAvatarUrl ? "orange" : "blue"}
              size={38}
              userId={postAuthor?.id}
              username={postAuthor?.username || postAuthor?.name}
              style={styles.avatarWrapper}
            />

            {displayName ? (
              <Text style={styles.username} numberOfLines={1}>
                {displayName}
              </Text>
            ) : null}
          </View>

          {caption ? (
            <View style={styles.captionWrapper}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleCommentPress}>
                <Text
                  style={[styles.caption, captionStyle]}
                  numberOfLines={isCaptionExpanded ? undefined : 3}
                  onTextLayout={handleCaptionLayout}
                >
                  {caption}
                </Text>
              </TouchableOpacity>
              {isCaptionTruncated ? (
                <TouchableOpacity onPress={toggleCaption}>
                  <Text style={styles.captionToggle}>
                    {isCaptionExpanded ? "Show less" : "Show more"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {renderMetaRow()}
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
        showFilter={showFilter}
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
        onToggleFollow={onToggleFollow}
        isFollowed={isFollowed}
        isBuddy={isBuddy}
        canFollow={canFollow}
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
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "15%",
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
  },
  captionWrapper: {
    flexShrink: 1,
  },
  avatarWrapper: {
    marginRight: 6,
  },
  username: {
    color: "#e2e8f0",
    fontWeight: "800",
    fontSize: 17,
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
  metaLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    columnGap: 4,
  },
  milestoneMetaRow: {
    justifyContent: "space-between",
    flexWrap: "nowrap",
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
    marginHorizontal: 4,
  },
  metaEmphasis: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  metaRightItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
});

export default FeedLayout;
