// components/FeedLayout.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  const [followPending, setFollowPending] = useState(false);

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

  const renderAvatar = () => {
    if (!avatarUrl && !fallbackAvatarSource) return null;

    const gradientColors = avatarUrl
      ? ["#fed7aa", "#f97316", "#facc15"]
      : ["#0ea5e9", "#6366f1", "#a855f7"];

    const avatarContent = avatarUrl ? (
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
    ) : fallbackAvatarSource ? (
      <Image source={fallbackAvatarSource} style={styles.avatar} />
    ) : (
      <View style={[styles.avatar, styles.avatarFallback]}>
        <Ionicons name="person" size={18} color="#0b1222" />
      </View>
    );

    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatarHalo}
      >
        <View style={styles.avatarInner}>{avatarContent}</View>
      </LinearGradient>
    );
  };

  const displayName =
    authorLabel ||
    (postAuthor
      ? `@${postAuthor?.username || postAuthor?.name || "Unknown"}`
      : null);

  const canFollow =
    Boolean(onToggleFollow) &&
    Boolean(postAuthor?.id) &&
    Boolean(viewerUserId) &&
    postAuthor?.id !== viewerUserId;

  const followLabel = isBuddy
    ? "Buddies"
    : isFollowed
    ? "Following"
    : "Follow";

  const handleFollowPress = async () => {
    if (!onToggleFollow || followPending || !canFollow) return;

    try {
      setFollowPending(true);
      await onToggleFollow();
    } catch (err) {
      console.error("Failed to toggle follow", err);
    } finally {
      setFollowPending(false);
    }
  };

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

      {/* Bottom-left: avatar + caption + meta */}
      <View style={styles.captionArea}>
        <View style={styles.captionCard}>
          <View style={styles.userRow}>
            {renderAvatar()}

            {displayName ? (
              <>
                <Text style={styles.username} numberOfLines={1}>
                  {displayName}
                </Text>

                {canFollow ? (
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      isBuddy
                        ? styles.buddyButton
                        : isFollowed
                        ? styles.followingButton
                        : null,
                    ]}
                    onPress={handleFollowPress}
                    disabled={followPending}
                  >
                    <Text style={styles.followButtonText}>
                      {followPending ? "..." : followLabel}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
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
  followButton: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#facc15",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  followingButton: {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
  },
  buddyButton: {
    backgroundColor: "#22c55e",
    borderColor: "#15803d",
  },
  followButtonText: {
    color: "#0b1222",
    fontWeight: "800",
    fontSize: 12,
  },
  captionWrapper: {
    flexShrink: 1,
  },
  avatarHalo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    padding: 2,
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 19,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    resizeMode: "cover",
    backgroundColor: "#0f172a",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#facc15",
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
