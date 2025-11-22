const cron = require("node-cron");
const { Expo } = require("expo-server-sdk");
const { User } = require("../models");

require("dotenv").config();

let expo = new Expo();

// Mirror your client-side milestones
const MILESTONES = [1, 3, 5, 7, 10, 14, 30, 60, 90, 180, 365];

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

// --- MAIN CRON JOB ---

const cronJob = async () => {
  try {
    // Milestone job
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
        const notifications = [];

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

          // 🔴 FIX: pass the whole user object, not user.username
          const { title, body } = buildMilestoneMessage(user, milestone);

          notifications.push({
            pushToken: user.token,
            title,
            body,
            data: {
              type: "milestone",
              milestoneDays: milestone,
            },
          });

          // mark this milestone as notified and save
          user.milestonesNotified = [...already, milestone];
          await user.save();
        }

        if (notifications.length) {
          await sendPushNotifications(notifications);
          console.log(
            `Sent ${notifications.length} milestone notification(s).`
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

    console.log("📆 Notification cron jobs scheduled.");
  } catch (err) {
    console.log("Error setting up cron jobs:", err);
  }
};

module.exports = {
  cronJob,
};
