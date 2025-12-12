import React from "react";
import { StyleSheet, Text, View } from "react-native";
import FeedLayout from "./FeedLayout";

const formatAuthorHandle = (author) => {
  if (!author?.username || !author.username.trim().length)
    return "Sober Motivation";
  return `@${author.username}`;
};

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

const QuoteFeedLayout = ({
  quote,
  viewsCount = null,
  isLiked,
  onLikePress,
  onMorePress,
  onToggleFollow,
  viewerUserId,
  onCommentAdded,
  contentStyle,
  children,
}) => {
  const author = quote.user;
  const avatarUrl = author?.profilePicUrl || null;
  const fallbackAvatar = !author ? require("../assets/icon.png") : null;
  const authorLabel = formatAuthorHandle(author);
  const createdDate = formatDate(quote?.createdAt);

  return (
    <FeedLayout
      caption={null}
      commentSheetCaption={`“${quote.text}”`}
      meta={createdDate || undefined}
      likesCount={quote.likesCount}
      commentsCount={quote.commentsCount}
      viewsCount={viewsCount ?? quote.viewsCount}
      comments={quote.comments}
      commentTargetType="QUOTE"
      commentTargetId={quote.id}
      postAuthor={author}
      postCreatedAt={quote.createdAt}
      avatarUrl={avatarUrl}
      fallbackAvatarSource={fallbackAvatar}
      authorLabel={authorLabel}
      showFilter={false}
      onMorePress={onMorePress}
      isLiked={isLiked}
      onLikePress={onLikePress}
      onCommentAdded={onCommentAdded}
      onToggleFollow={onToggleFollow}
      isFollowed={author?.isFollowedByViewer}
      isBuddy={author?.isBuddyWithViewer}
      viewerUserId={viewerUserId}
      contentStyle={contentStyle}
    >
      {children || (
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>“{quote.text}”</Text>
        </View>
      )}
    </FeedLayout>
  );
};

const styles = StyleSheet.create({
  quoteContainer: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  quoteText: {
    color: "#fef3c7",
    fontSize: 24,
    lineHeight: 34,
    fontWeight: "600",
    textAlign: "left",
  },
});

export default QuoteFeedLayout;
