import React, { useMemo } from "react";
import FeedLayout from "./FeedLayout";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const parsed = new Date(dateString);
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
  onToggleFollow,
  viewerUserId,
  onCommentAdded,
  contentStyle,
}) => {
  const author = post.author;
  const avatarUrl = author?.profilePicUrl || null;
  const type = post.mediaType || "VIDEO";
  const isVideoPost = type === "VIDEO";
  const cityName = post.closestCity?.name || null;
  const { isMilestonePost, metaText } = useMemo(() => buildMeta(post), [post]);

  return (
    <FeedLayout
      caption={post.text || ""}
      captionStyle={isMilestonePost ? styles.milestoneCaption : undefined}
      meta={metaText}
      likesCount={post.likesCount}
      commentsCount={post.commentsCount}
      viewsCount={getViewsCount(post)}
      comments={post.comments}
      postId={post.id}
      postCreatedAt={post.createdAt}
      postAuthor={author}
      avatarUrl={avatarUrl}
      cityName={cityName}
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
