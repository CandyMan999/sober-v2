export const NotificationTypes = {
  COMMENT_ON_POST: "COMMENT_ON_POST",
  COMMENT_REPLY: "COMMENT_REPLY",
  COMMENT_LIKED: "COMMENT_LIKED",
  FLAGGED_POST: "FLAGGED_POST",
  BUDDY_NEAR_BAR: "BUDDY_NEAR_BAR",
  MILESTONE: "MILESTONE",
};

export const NotificationIntents = {
  OPEN_POST_COMMENTS: "OPEN_POST_COMMENTS",
  ACKNOWLEDGE: "ACKNOWLEDGE",
  SHOW_INFO: "SHOW_INFO",
};

export const buildBuddyNearBarNotification = (buddyName) => ({
  id: `buddy-placeholder-${Date.now()}`,
  type: NotificationTypes.BUDDY_NEAR_BAR,
  title: "Buddy check-in",
  description: buddyName
    ? `${buddyName} was tracked near a bar. We're still wiring this up—stay tuned!`
    : "A buddy was tracked near a bar. Placeholder until tracking is live.",
  intent: NotificationIntents.ACKNOWLEDGE,
  placeholder: true,
  createdAt: new Date().toISOString(),
});
