// cron/notificationCron.js
const cron = require("node-cron");
const { Expo } = require("expo-server-sdk");
const { User, Quote, Post } = require("../models");
const { DateTime } = require("luxon");

require("dotenv").config();

let expo = new Expo();

// Mirror your client-side milestones
const MILESTONES = [1, 2, 3, 5, 7, 10, 14, 30, 60, 90, 180, 365];

const isWithinUserDaytime = (user) => {
  const tz = user?.timezone || "UTC";
  const userTime = DateTime.now().setZone(tz);
  const hour = userTime.isValid
    ? userTime.hour
    : DateTime.now().setZone("UTC").hour;

  return hour >= 8 && hour <= 22;
};

// --- Helpers ---

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

const getDaysBetween = (start, now = new Date()) => {
  if (!start) return 0;
  const s = new Date(start);
  if (!isValidDate(s)) return 0;

  // compare by days (truncate time)
  const startMid = new Date(s);
  startMid.setHours(0, 0, 0, 0);

  const nowMid = new Date(now);
  nowMid.setHours(0, 0, 0, 0);

  const diffMs = nowMid - startMid;
  if (diffMs <= 0) return 0;

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const buildMilestoneMessage = (user, milestoneDays) => {
  const name = user?.username || "You";
  const label = `Day ${milestoneDays}`;

  let body;

  switch (milestoneDays) {
    case 1:
      body = `${name}, day 1 is no joke. The cravings and old habits are loud right now, but you just proved you can do hard things. Stay close to your “why” today.`;
      break;

    case 2:
      body = `${name}, day 2 sober. Your brain is still yelling for the old routine — that’s normal. Reach for water, food, sleep, or support instead of a drink. You’re not starting over today.`;
      break;

    case 3:
      body = `${name}, day 3. For many people the roughest physical withdrawal starts to ease around now. Be gentle with your body, keep it simple, and protect your routine. This is where it starts to turn.`;
      break;

    case 5:
      body = `${name}, 5 days sober. You might notice tiny windows of clarity or better sleep. They’ll keep showing up if you keep saying no to that first drink. Keep stacking these days.`;
      break;

    case 7:
      body = `${name}, one full week sober.💪 Seven days of not giving in. That’s a real streak. Celebrate it in a sober way tonight and get ready to build week two.`;
      break;

    case 30:
      body = `One Month. Fuck yeah ${name}!😱 Don't forget the pain. I want you to think of the worst hangover you have ever had in your life for a minute`;
      break;

    default:
      body = `${name} just hit ${milestoneDays} day${
        milestoneDays === 1 ? "" : "s"
      } sober. Keep going — your future self is going to be so grateful for this version of you.`;
      break;
  }

  return {
    title: `Sober Motivation · ${label}`,
    body,
  };
};

const buildMilestoneCaptionText = (user, milestoneDays) => {
  const name = user?.username || "A member";
  const label = `Day ${milestoneDays}`;

  return `${name} just crossed ${label} sober. Drop a few words to keep their streak strong.`;
};

const ensureMilestonePost = async (user, milestoneDays) => {
  if (milestoneDays < 7) {
    return null; // only create posts for milestones day 7+
  }

  if (!user?.profilePicUrl) {
    console.log(
      `⚠️  Skipping milestone post for ${user?.username || user?._id} — no profilePicUrl`
    );
    return null;
  }

  const existing = await Post.findOne({
    author: user._id,
    isMilestone: true,
    milestoneDays,
  });

  if (existing) return existing;

  const milestoneTag = `[${milestoneDays}]`;

  const created = await Post.create({
    author: user._id,
    text: buildMilestoneCaptionText(user, milestoneDays),
    mediaType: "IMAGE",
    imageUrl: user.profilePicUrl,
    flagged: false,
    likesCount: 0,
    commentsCount: 0,
    isMilestone: true,
    milestoneDays,
    milestoneTag,
  });

  return Post.findById(created._id)
    .populate("author")
    .populate({
      path: "comments",
      populate: { path: "author" },
    });
};

const buildTestMessage = () => ({
  title: "Sober Motivation (Test)",
  body: "This is a test notification from the cron job ✅",
});

// Core push sender
const sendPushNotifications = async (notifications) => {
  if (!notifications.length) return;

  const messages = [];

  for (const n of notifications) {
    const { pushToken, title, body, data } = n;

    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: "default",
      title,
      body,
      data: data || {},
    });
  }

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      // console.log("Ticket chunk:", ticketChunk);
    } catch (error) {
      console.error("Error sending push chunk:", error);
    }
  }
};

// --- MAIN CRON JOB SETUP ---

const cronJob = () => {
  try {
    // ----- 1) Milestones job (still every 15 min; uses sobrietyStartAt) -----
    cron.schedule(
      "0 */15 * * * *", // every 15 minutes (for testing)
      async () => {
        console.log("⏰ Milestone cron tick at", new Date().toISOString());

        const users = await User.find({
          notificationsEnabled: true,
          sobrietyStartAt: { $ne: null },
        });

        if (!users.length) {
          console.log("No users with notifications enabled / sobrietyStartAt.");
          return;
        }

        const now = new Date();
        const personalNotifications = [];
        const celebrationNotifications = [];
        const notifiableUsers = await User.find({
          notificationsEnabled: true,
          token: { $ne: null },
        });

        for (const user of users) {
          const daysSober = getDaysBetween(user.sobrietyStartAt, now);

          console.log(
            `User ${user.username || user._id} → daysSober = ${daysSober}`
          );

          if (!daysSober || daysSober <= 0) continue;
          if (!user.token) continue; // no expo token

          const already = Array.isArray(user.milestonesNotified)
            ? user.milestonesNotified
            : [];

          // milestones user has reached but not yet notified on
          const dueMilestones = MILESTONES.filter(
            (m) => daysSober >= m && !already.includes(m)
          );

          if (!dueMilestones.length) continue;

          // highest milestone reached but not notified yet
          const milestone = Math.max(...dueMilestones);

          const { title, body } = buildMilestoneMessage(user, milestone);

          personalNotifications.push({
            pushToken: user.token,
            title,
            body,
            data: {
              type: "milestone",
              milestoneDays: milestone,
            },
          });

          const milestonePost = await ensureMilestonePost(user, milestone);
          const milestoneTag = `[${milestone}]`;

          if (milestonePost) {
            const celebrationTitle = `${
              user.username || "A member"
            } hit day ${milestone}!`;
            const celebrationBody =
              "Tap to congratulate them and keep their streak going.";

            for (const recipient of notifiableUsers) {
              if (!recipient.token) continue;
              if (String(recipient._id) === String(user._id)) continue;
              if (!isWithinUserDaytime(recipient)) continue;

              celebrationNotifications.push({
                pushToken: recipient.token,
                title: celebrationTitle,
                body: celebrationBody,
                data: {
                  type: "milestone_celebration",
                  milestoneDays: milestone,
                  milestoneTag,
                  postId: String(milestonePost._id),
                  userId: String(user._id),
                },
              });
            }
          }

          // mark this milestone as notified and save
          user.milestonesNotified = [...already, milestone];
          await user.save();
        }

        const combinedNotifications = [
          ...personalNotifications,
          ...celebrationNotifications,
        ];

        if (combinedNotifications.length) {
          await sendPushNotifications(combinedNotifications);
          console.log(
            `Sent ${combinedNotifications.length} milestone notification(s) (${personalNotifications.length} personal, ${celebrationNotifications.length} celebration).`
          );
        } else {
          console.log("No milestone notifications due this tick.");
        }
      },
      {
        scheduled: true,
        timezone: "America/Chicago",
      }
    );

    // ----- 2) Quotes job (every 2 hours, per-user time-window 8am–10pm) -----
    cron.schedule(
      "0 0 */2 * * *", // every 2 hours at minute 0, second 0
      async () => {
        console.log("💬 Quote cron tick at", new Date().toISOString());

        const users = await User.find({
          notificationsEnabled: true,
          token: { $ne: null },
        });

        if (!users.length) {
          console.log("No users with push tokens.");
          return;
        }

        // fetch unused approved quotes
        let quotes = await Quote.find({ isApproved: true, isUsed: false });

        if (!quotes.length) {
          console.log("No unused quotes — resetting used flags.");
          await Quote.updateMany(
            { isApproved: true },
            { $set: { isUsed: false } }
          );
          quotes = await Quote.find({ isApproved: true, isUsed: false });
        }

        if (!quotes.length) {
          console.log("Still no quotes available. Skipping.");
          return;
        }

        // pick a random quote
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        quote.isUsed = true;
        await quote.save();

        const notifications = [];

        for (const user of users) {
          const tz = user.timezone || "UTC";
          const userTime = DateTime.now().setZone(tz);
          const hour = userTime.hour;

          // only send if between 08:00 and 22:00 local time
          if (hour >= 8 && hour <= 22) {
            notifications.push({
              pushToken: user.token,
              title: "Sober Motivation",
              body: quote.text,
              data: { type: "quote", quoteId: String(quote._id) },
            });

            console.log(
              `Queued quote for ${
                user.username
              } (${tz}) — local time: ${userTime.toFormat("h:mm a")}`
            );
          } else {
            console.log(
              `⏸ Skipped ${
                user.username
              } (${tz}) — current: ${userTime.toFormat("h:mm a")}`
            );
          }
        }

        if (!notifications.length) {
          console.log("No eligible users this interval.");
          return;
        }

        await sendPushNotifications(notifications);

        console.log(
          `📨 Sent quote "${quote.text}" to ${notifications.length} user(s).`
        );
      },
      {
        scheduled: true,
        timezone: "UTC", // cron runs on server time; we adjust per user
      }
    );

    console.log("📆 Notification cron jobs scheduled.");
  } catch (err) {
    console.log("Error setting up cron jobs:", err);
  }
};

module.exports = {
  cronJob,
};
