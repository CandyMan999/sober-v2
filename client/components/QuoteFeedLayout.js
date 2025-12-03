import React from "react";
import { StyleSheet, Text, View } from "react-native";
import FeedLayout from "./FeedLayout";

const formatAuthorHandle = (author) => {
  if (!author?.username || !author.username.trim().length)
    return "Sober Motivation";
  return `@${author.username}`;
};

const QuoteFeedLayout = ({
  quote,
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

  return (
    <FeedLayout
      caption={null}
      commentSheetCaption={`“${quote.text}”`}
      likesCount={quote.likesCount}
      commentsCount={quote.commentsCount}
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
