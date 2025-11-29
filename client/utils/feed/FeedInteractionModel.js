import {
  FOLLOW_USER_MUTATION,
  TOGGLE_LIKE_MUTATION,
  UNFOLLOW_USER_MUTATION,
} from "../../GraphQL/mutations";
import { getToken } from "../helpers";
import Toast from "react-native-toast-message";

class FeedInteractionModel {
  constructor({
    client,
    currentUser,
    currentUserId,
    getItems,
    setItems,
    authorKey = "author",
    targetType = "POST",
    itemLabel = "item",
    getLoadingUserIds,
    setLoadingUserIds,
  }) {
    this.client = client;
    this.currentUser = currentUser;
    this.currentUserId = currentUserId;
    this.getItems = getItems;
    this.setItems = setItems;
    this.authorKey = authorKey;
    this.targetType = targetType;
    this.itemLabel = itemLabel;
    this.getLoadingUserIds = getLoadingUserIds;
    this.setLoadingUserIds = setLoadingUserIds;
  }

  isItemLiked(item) {
    if (!this.currentUserId || !item) return false;
    return (item.likes || []).some((like) => like?.user?.id === this.currentUserId);
  }

  applyLikePayload(itemId, payload) {
    if (!payload) return;

    this.setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const existingLikes = item.likes || [];
        const actorId = payload.like?.user?.id || this.currentUserId;
        const filtered = existingLikes.filter((like) => like?.user?.id !== actorId);

        if (payload.liked && payload.like) {
          return {
            ...item,
            likesCount: payload.likesCount,
            likes: [...filtered, payload.like],
          };
        }

        return {
          ...item,
          likesCount: payload.likesCount,
          likes: filtered,
        };
      })
    );
  }

  updateAuthorRelationship(authorId, fields = {}) {
    if (!authorId) return;

    this.setItems((prev) =>
      prev.map((item) =>
        item[this.authorKey]?.id === authorId
          ? { ...item, [this.authorKey]: { ...item[this.authorKey], ...fields } }
          : item
      )
    );
  }

  setFollowLoading(userId, loading) {
    if (!this.setLoadingUserIds) return;
    this.setLoadingUserIds((prev) => {
      const current = prev instanceof Set ? prev : new Set();
      const next = new Set(current);
      if (loading) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }

  getFollowLoadingIds() {
    if (!this.getLoadingUserIds) return new Set();
    const ids = this.getLoadingUserIds();
    return ids instanceof Set ? ids : new Set();
  }

  async notifyBuddyConnection(author) {
    if (!author?.id) return;

    Toast.show({
      type: "info",
      text1: "You're now buddies",
      text2: `${author?.username || "This member"} will get a heads up.`,
      position: "top",
      autoHide: true,
      visibilityTime: 5000,
      topOffset: 80,
    });
  }

  async toggleLike(itemId) {
    const token = await getToken();
    if (!token) return;

    const items = this.getItems ? this.getItems() : [];
    const previous = items.map((item) => ({
      ...item,
      likes: item.likes ? [...item.likes] : [],
    }));

    const target = items.find((item) => item.id === itemId);
    const currentlyLiked = this.isItemLiked(target);
    const optimisticUser = this.currentUser || { id: this.currentUserId };

    this.setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const filtered = (item.likes || []).filter(
          (like) => like?.user?.id !== this.currentUserId
        );

        const optimisticLikes = currentlyLiked
          ? filtered
          : [...filtered, { id: `temp-like-${itemId}`, user: optimisticUser }];

        return {
          ...item,
          likesCount: Math.max(0, (item.likesCount || 0) + (currentlyLiked ? -1 : 1)),
          likes: optimisticLikes,
        };
      })
    );

    try {
      const data = await this.client.request(TOGGLE_LIKE_MUTATION, {
        token,
        targetType: this.targetType,
        targetId: itemId,
      });

      this.applyLikePayload(itemId, data?.toggleLike);
    } catch (err) {
      console.error(`Error toggling ${this.itemLabel} like`, err);
      this.setItems(previous);
    }
  }

  async toggleFollow(author) {
    if (!author?.id) return { isFollowed: false, isBuddy: false };
    if (this.getFollowLoadingIds().has(author.id)) {
      return {
        isFollowed: Boolean(author.isFollowedByViewer),
        isBuddy: Boolean(author.isBuddyWithViewer),
      };
    }

    const token = await getToken();
    if (!token) {
      return {
        isFollowed: Boolean(author.isFollowedByViewer),
        isBuddy: Boolean(author.isBuddyWithViewer),
      };
    }

    const previousState = {
      isFollowed: Boolean(author.isFollowedByViewer),
      isBuddy: Boolean(author.isBuddyWithViewer),
    };

    const isCurrentlyFollowed = previousState.isFollowed;

    this.updateAuthorRelationship(author.id, {
      isFollowedByViewer: !isCurrentlyFollowed,
      isBuddyWithViewer: false,
    });
    this.setFollowLoading(author.id, true);

    try {
      const mutation = isCurrentlyFollowed
        ? UNFOLLOW_USER_MUTATION
        : FOLLOW_USER_MUTATION;

      const data = await this.client.request(mutation, { token, userId: author.id });

      const nextState = isCurrentlyFollowed
        ? { isFollowed: false, isBuddy: false }
        : {
            isFollowed: true,
            isBuddy: Boolean(data?.followUser?.isBuddy),
          };

      this.updateAuthorRelationship(author.id, {
        isFollowedByViewer: nextState.isFollowed,
        isBuddyWithViewer: nextState.isBuddy,
      });

      if (nextState.isBuddy) {
        await this.notifyBuddyConnection(author);
      }

      return nextState;
    } catch (err) {
      console.error("Error toggling follow", err);
      this.updateAuthorRelationship(author.id, {
        isFollowedByViewer: previousState.isFollowed,
        isBuddyWithViewer: previousState.isBuddy,
      });
      throw err;
    } finally {
      this.setFollowLoading(author.id, false);
    }
  }
}

export default FeedInteractionModel;
