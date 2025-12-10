const defaultNotificationSettings = {
  allPushEnabled: false,
  otherUserMilestones: true,
  otherUserComments: true,
  followingPosts: true,
  buddiesNearVenue: true,
  dailyPush: true,
  locationTrackingEnabled: true,
};

const NotificationCategories = {
  OTHER_USER_MILESTONES: "OTHER_USER_MILESTONES",
  OTHER_USER_COMMENTS: "OTHER_USER_COMMENTS",
  FOLLOWING_POSTS: "FOLLOWING_POSTS",
  BUDDIES_NEAR_VENUE: "BUDDIES_NEAR_VENUE",
  DAILY_PUSH: "DAILY_PUSH",
};

const normalizeNotificationSettings = (user) => {
  const merged = {
    ...defaultNotificationSettings,
    ...(user?.notificationSettings || {}),
  };

  if (typeof user?.notificationsEnabled === "boolean") {
    merged.allPushEnabled = user.notificationsEnabled;
  }

  return merged;
};

const shouldSendPush = (user, category) => {
  const settings = normalizeNotificationSettings(user);

  if (settings.allPushEnabled === false) return false;

  switch (category) {
    case NotificationCategories.OTHER_USER_MILESTONES:
      return settings.otherUserMilestones !== false;
    case NotificationCategories.OTHER_USER_COMMENTS:
      return settings.otherUserComments !== false;
    case NotificationCategories.FOLLOWING_POSTS:
      return settings.followingPosts !== false;
    case NotificationCategories.BUDDIES_NEAR_VENUE:
      return settings.buddiesNearVenue !== false;
    case NotificationCategories.DAILY_PUSH:
      return settings.dailyPush !== false;
    default:
      return true;
  }
};

module.exports = {
  defaultNotificationSettings,
  NotificationCategories,
  normalizeNotificationSettings,
  shouldSendPush,
};
