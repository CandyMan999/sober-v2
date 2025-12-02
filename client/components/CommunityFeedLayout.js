import React, { useMemo } from "react";
import FeedLayout from "./FeedLayout";

const formatDate = (dateInput) => {
  if (!dateInput) return "";

  const numericValue =
    typeof dateInput === "number" || typeof dateInput === "bigint"
      ? Number(dateInput)
      : Number.parseInt(dateInput, 10);

  const parsed = Number.isFinite(numericValue)
    ? new Date(numericValue)
    : new Date(dateInput);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getViewsCount = (post) => {
  if (!post) return 0;
  if (typeof post.viewsCount === "number") return post.viewsCount;
  return post.video?.viewsCount ?? 0;
};

const buildMeta = (post) => {
  const postDate = formatDate(post.createdAt);
  const isMilestonePost = post.isMilestone || Boolean(post.milestoneTag);
  const milestoneLabel =
    post.milestoneDays !== null && post.milestoneDays !== undefined
      ? `Day ${post.milestoneDays} milestone`
      : post.milestoneTag || null;

  const metaText =
    isMilestonePost && milestoneLabel
      ? `${milestoneLabel} • ${postDate}`
      : postDate;

  return { isMilestonePost, milestoneLabel, metaText };
};

const CommunityFeedLayout = ({
  post,
  children,
  isMuted,
  onToggleSound,
  isLiked,
  onLikePress,
  onMorePress,
  onFilterPress,
  showFilter = true,
  onToggleFollow,
  viewerUserId,
  onCommentAdded,
  contentStyle,
}) => {
  const author = post.author;
  const { isMilestonePost, metaText } = useMemo(() => buildMeta(post), [post]);
  const baseCityName = post.closestCity?.name || post.cityName || null;
  const metaCityName = isMilestonePost ? null : baseCityName;

  const drunkAvatarUrl = author?.drunkPicUrl || null;
  const avatarUrl =
    isMilestonePost && drunkAvatarUrl
      ? drunkAvatarUrl
      : author?.profilePicUrl || author?.profilePic?.url || null;
  const baseAvatarSize = 38;
  const avatarSize =
    isMilestonePost && drunkAvatarUrl
      ? Math.round(baseAvatarSize * 1.3)
      : baseAvatarSize;
  const avatarAspectRatio = isMilestonePost && drunkAvatarUrl ? 3 / 4 : 1;
  const type = post.mediaType || "VIDEO";
  const isVideoPost = type === "VIDEO";
  const commentCityName = baseCityName;

  return (
    <FeedLayout
      caption={post.text || ""}
      captionStyle={isMilestonePost ? styles.milestoneCaption : undefined}
      meta={metaText}
      metaCityName={metaCityName}
      likesCount={post.likesCount}
      commentsCount={post.commentsCount}
      viewsCount={getViewsCount(post)}
      comments={post.comments}
      postId={post.id}
      postCreatedAt={post.createdAt}
      postAuthor={author}
      avatarUrl={avatarUrl}
      avatarSize={avatarSize}
      avatarAspectRatio={avatarAspectRatio}
      cityName={commentCityName}
      isMilestonePost={isMilestonePost}
      isVideoPost={isVideoPost}
      onCommentAdded={onCommentAdded}
      contentStyle={contentStyle}
      showSoundToggle={isVideoPost}
      isMuted={isVideoPost ? isMuted : true}
      onToggleSound={isVideoPost ? onToggleSound : undefined}
      isLiked={isLiked}
      onLikePress={onLikePress}
      onMorePress={onMorePress}
      onFilterPress={onFilterPress}
      showFilter={showFilter}
      onToggleFollow={onToggleFollow}
      isFollowed={author?.isFollowedByViewer}
      isBuddy={author?.isBuddyWithViewer}
      viewerUserId={viewerUserId}
    >
      {children}
    </FeedLayout>
  );
};

const styles = {
  milestoneCaption: {
    color: "#fef3c7",
    fontWeight: "600",
  },
};

export default CommunityFeedLayout;
