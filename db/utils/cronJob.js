// cron/notificationCron.js
const cron = require("node-cron");
const { Expo } = require("expo-server-sdk");
const { User, Quote, Post, Picture } = require("../models");
const {
  NotificationTypes,
  NotificationIntents,
  createNotificationForUser,
} = require("./notifications");
const { findClosestCity } = require("./location");
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

const getDaysBetween = (start, now = new Date(), tz = "UTC") => {
  if (!start) return 0;

  const startDt = DateTime.fromJSDate(new Date(start)).setZone(tz);
  const nowDt = DateTime.fromJSDate(new Date(now)).setZone(tz);

  if (!startDt.isValid || !nowDt.isValid) return 0;

  const diffDays = nowDt.diff(startDt, "days").days;
  if (diffDays <= 0) return 0;

  return Math.round(diffDays);
};

const calculateAverageRelapseDay = (streaks = []) => {
  if (!Array.isArray(streaks) || !streaks.length) return null;

  const durations = streaks
    .map((streak) => {
      if (!streak?.startAt || !streak?.endAt) return null;
      const start = new Date(streak.startAt);
      const end = new Date(streak.endAt);

      if (!isValidDate(start) || !isValidDate(end)) return null;

      const diffMs = end.getTime() - start.getTime();
      if (diffMs <= 0) return null;

      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    })
    .filter((d) => d > 0);

  if (!durations.length) return null;

  const average =
    durations.reduce((sum, days) => sum + days, 0) / durations.length;

  return Math.round(average);
};

const clearRelapseReminderState = (user) => {
  user.averageRelapseDay = null;
  user.relapseReminderLastSentAt = null;
  user.relapseReminderStartAt = null;
};

const refreshAverageRelapseDays = async () => {
  console.log("📊 Refreshing average relapse days", new Date().toISOString());

  const users = await User.find({});
  if (!users.length) {
    console.log("No users found while refreshing relapse averages.");
    return;
  }

  let updatedCount = 0;

  for (const user of users) {
    const average = calculateAverageRelapseDay(user.streaks || []);
    const existing =
      user.averageRelapseDay != null && Number.isFinite(user.averageRelapseDay)
        ? Number(user.averageRelapseDay)
        : null;

    if (average == null) {
      if (existing != null || user.relapseReminderLastSentAt) {
        clearRelapseReminderState(user);
        await user.save();
        updatedCount += 1;
      }
      continue;
    }

    if (existing !== average) {
      user.averageRelapseDay = average;
      user.relapseReminderLastSentAt = null;
      user.relapseReminderStartAt = null;
      await user.save();
      updatedCount += 1;
    }
  }

  console.log(`✅ Average relapse days refreshed for ${updatedCount} user(s).`);
};

const hasSentRelapseReminderToday = (user, nowInTz) => {
  if (!user?.relapseReminderLastSentAt) return false;

  const last = DateTime.fromJSDate(user.relapseReminderLastSentAt).setZone(
    user?.timezone || "UTC"
  );

  if (!last.isValid) return false;

  return last.hasSame(nowInTz, "day");
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

    case 10:
      body = `You made it 10 days ${name}. This is around the time people start to forget the pain and think drinking is a good idea. That is just your addictive voice talking to you. Stop for a minute and think about the worst hangover you have ever had`;
      break;

    case 14:
      body = `2 weeks ${name}! You got this shit, don't let that weak little addictive bitch voice get you!`;
      break;

    case 30:
      body = `One Month. Fuck yeah ${name}!😱 Don't forget the pain. I want you to think of the worst hangover you have ever had in your life for a minute`;
      break;

    case 60:
      body = `2 Months down! Now ${name} build a life you are proud of instead of one you need to escape from because of all the problems drinking has caused you. Most of your problems are somehow related to drinking!`;
      break;

    case 90:
      body = `3 Months in ${name}, thinking you have a handle on drinking now and that you can have a few drinks because you proved you can stop is the DUMBEST FUCKING IDEA YOU CAN HAVE EVER!`;
      break;

    case 180:
      body = `${name}, 6 months! Half a year without feeling like shit or doing something stupid. Keep up this streak and acheive all of your dreams!`;
      break;

    case 365:
      body = `Happy aniversary ${name}, you are a whole new healthier version of yourself! Keep this sober lifestyle going and don't look back. Don't envy people for drinking a posion - you are the lucky one.`;
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

const getMilestoneImageForUser = (user) => {
  if (!user) return null;

  const pickPicture = (picKey, urlKey) => {
    const populatedPic = user?.[picKey];
    const hasPopulatedData = populatedPic && typeof populatedPic === "object";

    if (hasPopulatedData && populatedPic.url) {
      return { url: populatedPic.url, publicId: populatedPic.publicId || null };
    }

    if (user?.[urlKey]) {
      return {
        url: user[urlKey],
        publicId: hasPopulatedData ? populatedPic.publicId : null,
      };
    }

    return null;
  };

  // 1) Prefer drunk pic
  const drunkPic = pickPicture("drunkPic", "drunkPicUrl");
  if (drunkPic) return drunkPic;

  // 2) Fallback to profile pic
  const profilePic = pickPicture("profilePic", "profilePicUrl");
  if (profilePic) return profilePic;

  // 3) No image → no post
  return null;
};

const buildMilestoneCaptionText = (user, milestoneDays) => {
  const name = user?.username || "A member";
  const label = `Day ${milestoneDays}`;

  return `${name} just crossed ${label} sober. Drop a few words to keep their streak strong.`;
};

const ensureMilestonePost = async (user, milestoneDays) => {
  console.log(
    `[ensureMilestonePost] user=${
      user?.username || user?._id
    }, milestoneDays=${milestoneDays}`
  );

  if (milestoneDays < 7) {
    console.log("[ensureMilestonePost] <7 days, skipping post creation");
    return null; // only create posts for milestones day 7+
  }

  // ✅ Try to use a milestone artwork image (day7/day10/day14/day365/etc)
  let imageMeta = await pickRandomMilestoneImage(milestoneDays);
  console.log(`[ensureMilestonePost] pickRandomMilestoneImage ->`, imageMeta);

  // 🟡 If none exist yet for this day, fall back to user drunk/profile pic
  if (!imageMeta) {
    imageMeta = getMilestoneImageForUser(user);
    console.log(
      `[ensureMilestonePost] fallback getMilestoneImageForUser ->`,
      imageMeta
    );
  }

  if (!imageMeta?.url) {
    console.log(
      `⚠️  Skipping milestone post for ${
        user?.username || user?._id
      } — no milestone art and no drunk/profile image`
    );
    return null;
  }

  const postLocation = {
    lat: user?.lat ?? null,
    long: user?.long ?? null,
    closestCity: null,
  };

  const geoLocation =
    postLocation.lat !== null && postLocation.long !== null
      ? {
          type: "Point",
          coordinates: [postLocation.long, postLocation.lat],
        }
      : null;

  if (postLocation.lat !== null && postLocation.long !== null) {
    const nearestCity = await findClosestCity(
      postLocation.lat,
      postLocation.long
    );
    if (nearestCity?._id) {
      postLocation.closestCity = nearestCity._id;
    }
  }

  const milestoneTag = `[${milestoneDays}]`;

  const created = await Post.create({
    author: user._id,
    text: buildMilestoneCaptionText(user, milestoneDays),
    mediaType: "IMAGE",
    imageUrl: imageMeta.url, // <-- prefers milestone art, then drunk/profile
    imagePublicId: imageMeta.publicId || null,
    flagged: false,
    likesCount: 0,
    commentsCount: 0,
    isMilestone: true,
    milestoneDays,
    milestoneTag,
    ...postLocation,
    ...(geoLocation ? { location: geoLocation } : {}),
  });

  console.log("!!!!!!!!!!! POST CREATED: ", created);

  // Return fully-populated post for the cron loop to use in push notifications
  return Post.findById(created._id)
    .populate("author")
    .populate("closestCity")
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

const pickRandomMilestoneImage = async (milestoneDays) => {
  if (!milestoneDays) return null;

  const milestoneKey = `day${milestoneDays}`;
  console.log("[pickRandomMilestoneImage] milestoneKey =", milestoneKey);

  try {
    const pictures = await Picture.find({ milestone: milestoneKey }).lean();
    console.log(
      `[pickRandomMilestoneImage] found ${pictures.length} picture(s) for ${milestoneKey}`
    );

    if (!pictures || pictures.length === 0) {
      return null;
    }

    const idx = Math.floor(Math.random() * pictures.length);
    const chosen = pictures[idx];

    return {
      url: chosen.url,
      publicId: chosen.publicId || null,
    };
  } catch (err) {
    console.error(
      `[milestone] Failed to fetch milestone art for ${milestoneKey}:`,
      err?.message || err
    );
    return null;
  }
};

// --- MAIN CRON JOB SETUP ---

const cronJob = () => {
  try {
    // ----- 0) Refresh average relapse day once daily -----
    cron.schedule(
      "0 15 3 * * *", // daily at 03:15 UTC
      async () => {
        try {
          await refreshAverageRelapseDays();
        } catch (err) {
          console.error("Failed to refresh relapse averages", err);
        }
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    // ----- 0b) Relapse prevention reminders at 7pm local time -----
    cron.schedule(
      "0 0 * * * *", // hourly to catch 7pm in each timezone
      async () => {
        console.log("🛡️  Relapse reminder cron tick", new Date().toISOString());

        const users = await User.find({
          notificationsEnabled: true,
          token: { $ne: null },
          sobrietyStartAt: { $ne: null },
          averageRelapseDay: { $gt: 0 },
        });

        if (!users.length) {
          console.log("No users eligible for relapse reminders right now.");
          return;
        }

        const notifications = [];

        for (const user of users) {
          const tz = user.timezone || "UTC";
          const userTime = DateTime.now().setZone(tz);

          if (!userTime.isValid) continue;
          if (userTime.hour !== 19) continue; // only at 7pm local time
          if (hasSentRelapseReminderToday(user, userTime)) continue;

          const daysSober = getDaysBetween(
            user.sobrietyStartAt,
            userTime.toJSDate(),
            tz
          );

          if (daysSober !== user.averageRelapseDay) continue;

          const username = user.username || "buddy";
          const message = `Based on history ${username} you usually relapse on day ${user.averageRelapseDay}, keep strong fight that addictive voice.`;

          notifications.push({
            pushToken: user.token,
            title: "Stay strong",
            body: message,
            data: {
              type: "relapse_prediction",
              message,
              day: user.averageRelapseDay,
              username,
            },
          });

          user.relapseReminderLastSentAt = userTime.toJSDate();
          user.relapseReminderStartAt = user.sobrietyStartAt;
          await user.save();
        }

        if (notifications.length) {
          await sendPushNotifications(notifications);
          console.log(
            `📨 Sent ${notifications.length} relapse prevention notification(s).`
          );
        } else {
          console.log("No relapse reminders were due this interval.");
        }
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );

    // Prime averages on startup so the UI can use them immediately
    refreshAverageRelapseDays().catch((err) =>
      console.error("Failed to prime relapse averages", err)
    );

    // ----- 1) Milestones job (still every 15 min; uses sobrietyStartAt) -----
    cron.schedule(
      "0 */15 * * * *", // every 15 minutes (for testing)
      async () => {
        console.log("⏰ Milestone cron tick at", new Date().toISOString());

        const users = await User.find({
          notificationsEnabled: true,
          sobrietyStartAt: { $ne: null },
        }).populate(["drunkPic", "profilePic"]);

        if (!users.length) {
          console.log("No users with notifications enabled / sobrietyStartAt.");
          return;
        }

        const now = new Date();
        const personalNotifications = [];
        const celebrationNotifications = [];

        for (const user of users) {
          const tz = user.timezone || "UTC";
          const daysSober = getDaysBetween(user.sobrietyStartAt, now, tz);

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

          const milestoneTag = `[${milestone}]`;
          const notificationId = `milestone-${milestone}`;

          personalNotifications.push({
            pushToken: user.token,
            title,
            body,
            data: {
              id: notificationId,
              type: NotificationTypes.MILESTONE,
              milestoneDays: milestone,
              milestoneTag,
            },
          });

          await createNotificationForUser({
            userId: user._id,
            notificationId,
            type: NotificationTypes.MILESTONE,
            title,
            description: body,
            intent: NotificationIntents.SHOW_INFO,
            milestoneDays: milestone,
            milestoneTag,
            createdAt: now,
          });

          const milestonePost = await ensureMilestonePost(user, milestone);

          if (milestonePost) {
            const celebrationTitle = `${
              user.username || "A member"
            } hit day ${milestone}!`;
            const celebrationBody =
              "Tap to congratulate them and keep their streak going.";

            const celebrationPushRecipients = await User.find({
              _id: { $ne: user._id },
              notificationsEnabled: true,
              token: { $ne: null },
            });

            for (const recipient of celebrationPushRecipients) {
              if (!isWithinUserDaytime(recipient)) continue;

              const notificationData = {
                type: "milestone_celebration",
                milestoneDays: milestone,
                milestoneTag,
                postId: String(milestonePost._id),
                userId: String(user._id),
                senderUsername: user.username || "A member",
              };

              celebrationNotifications.push({
                pushToken: recipient.token,
                title: celebrationTitle,
                body: celebrationBody,
                data: notificationData,
              });
            }

            const celebrationAlertRecipients = await User.find({
              _id: { $ne: user._id },
            });

            for (const recipient of celebrationAlertRecipients) {
              await createNotificationForUser({
                userId: recipient._id,
                notificationId: `follow-milestone-${milestonePost._id.toString()}`,
                type: NotificationTypes.MILESTONE,
                title: celebrationTitle,
                description: celebrationBody,
                intent: NotificationIntents.OPEN_POST_COMMENTS,
                postId: String(milestonePost._id),
                milestoneDays: milestone,
                milestoneTag,
                createdAt: milestonePost?.createdAt,
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
              data: { type: "new_quote", quoteId: String(quote._id) },
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
