// resolvers/mutations/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");

const { Room, User, Comment, Like } = require("../../models");
const {
  publishDirectMessage,
  publishDirectRoomUpdate,
  publishDirectTyping,
  normalizeCommentForGraphQL,
} = require("../subscription/subscription");
const {
  populateDirectRoom,
  ensureSingleDirectRoom,
} = require("../utils/directMessage");
const { sendPushNotifications } = require("../../utils/pushNotifications");
const openai = require("../openaiClient");

const SOBER_COMPANION_USER_ID =
  process.env.SOBER_COMPANION_USER_ID || "693394413ea6a3e530516505";

const sendMessageBetweenUsers = async ({
  sender,
  recipient,
  text,
  replyTo,
  sendPush = true,
}) => {
  const room = await ensureSingleDirectRoom(sender._id, recipient._id);
  if (!room) {
    throw new Error("Unable to locate or create direct message room.");
  }

  const comment = await Comment.create({
    text: text.trim(),
    author: sender._id,
    targetType: "ROOM",
    targetId: room._id,
    replyTo: replyTo || null,
  });

  room.lastMessageAt = new Date();
  room.lastMessage = comment._id;
  room.comments = [...new Set([...(room.comments || []), comment._id])];
  await room.save();

  const populatedComment = await Comment.findById(comment._id)
    .populate({ path: "author", populate: "profilePic" })
    .exec();

  const normalized = normalizeCommentForGraphQL(populatedComment);

  publishDirectMessage(normalized);

  const hydratedRoom = await populateDirectRoom(room);
  if (hydratedRoom) {
    publishDirectRoomUpdate(hydratedRoom);
  }

  if (
    sendPush &&
    recipient?.token &&
    recipient?.notificationsEnabled !== false &&
    sender
  ) {
    const trimmedBody = text.trim();
    const preview =
      trimmedBody.length > 140
        ? `${trimmedBody.slice(0, 137)}...`
        : trimmedBody;

    await sendPushNotifications([
      {
        pushToken: recipient.token,
        title: `${sender.username || "Someone"} sent you a message`,
        body: preview,
        data: {
          type: "direct_message",
          roomId: String(room._id),
          senderId: String(sender._id),
          senderUsername: sender.username || "Someone",
          senderProfilePicUrl: sender.profilePicUrl || null,
        },
      },
    ]);
  }

  return { normalized, hydratedRoom };
};

const sendDirectMessageResolver = async (
  _,
  { recipientId, text, replyTo },
  ctx
) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");

  if (!text || !text.trim()) {
    throw new UserInputError("Message text is required.");
  }

  if (String(me._id) === String(recipientId)) {
    throw new UserInputError("Cannot send a DM to yourself.");
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new UserInputError("Recipient not found.");
  }

  const { normalized } = await sendMessageBetweenUsers({
    sender: me,
    recipient,
    text,
    replyTo,
    sendPush: true,
  });

  return normalized;
};

const setDirectTypingResolver = async (_, { roomId, isTyping }, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");

  if (!roomId) throw new UserInputError("Room ID is required.");

  const room = await Room.findById(roomId).populate("users");
  if (!room) throw new UserInputError("Room not found.");

  const isParticipant = room.users?.some(
    (user) => String(user._id || user.id) === String(me._id)
  );
  if (!isParticipant) throw new AuthenticationError("Not a participant");

  const typingPayload = {
    roomId: room._id.toString(),
    userId: me._id.toString(),
    username: me.username,
    profilePicUrl: me.profilePicUrl,
    isTyping: Boolean(isTyping),
    lastTypedAt: new Date().toISOString(),
  };

  publishDirectTyping(typingPayload);

  return typingPayload;
};

const deleteDirectRoomResolver = async (_, { roomId }, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");

  if (!roomId) throw new UserInputError("Room ID is required.");

  const room = await Room.findById(roomId).populate("users");
  if (!room || !room.isDirect) {
    throw new UserInputError("Direct room not found.");
  }

  const isParticipant = room.users?.some(
    (user) => String(user._id || user.id) === String(me._id)
  );

  if (!isParticipant) {
    throw new AuthenticationError("Not a participant");
  }

  const commentsForRoom = await Comment.find({
    targetType: "ROOM",
    targetId: room._id,
  })
    .select("_id")
    .lean()
    .exec();

  const commentIds = Array.from(
    new Set(
      [
        ...(room.comments || []).map((commentId) => commentId?.toString?.()),
        ...commentsForRoom.map((comment) => comment._id?.toString?.()),
      ].filter(Boolean)
    )
  );

  if (commentIds.length) {
    await Like.deleteMany({ targetType: "COMMENT", targetId: { $in: commentIds } });
    await Comment.deleteMany({ _id: { $in: commentIds } });
  }

  await Room.deleteOne({ _id: room._id });

  return true;
};

const therapyChatResolver = async (_, { message, history = [] }, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");

  if (!message || !message.trim()) {
    throw new UserInputError("Message text is required.");
  }

  const companion = await User.findById(SOBER_COMPANION_USER_ID);
  if (!companion) {
    throw new Error("Sober companion account is unavailable.");
  }

  const historyMessages = Array.isArray(history)
    ? history
        .map((entry) => {
          if (!entry?.content) return null;
          const role = entry?.role === "assistant" ? "assistant" : "user";
          return { role, content: String(entry.content) };
        })
        .filter(Boolean)
    : [];

  let reply =
    "I’m here for you. Tell me what’s going on, and we’ll take it one step at a time.";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a compassionate, calm, emotionally supportive guide inside the Sober Motivation app.
You are NOT a therapist, doctor, or emergency service. 
Your purpose is to give general emotional support, reflective questions, and practical coping strategies that help people stay sober, motivated, and grounded.

Your tone:
- Warm, steady, encouraging
- Never judgmental
- Always validating feelings
- Sound like a supportive coach or mentor, not a clinician
- Keep language simple, human, and conversational

Your goals:
- Help the user feel heard and understood
- Offer gentle guidance and perspective
- Ask thoughtful questions when appropriate
- Encourage healthy habits, reflection, and positive momentum
- Reinforce that Sober Motivation is proud of them for making progress

Safety rules:
- If the user expresses thoughts of self-harm, hurting others, or being unsafe:
    *Tell them you care*
    *Say you are not an emergency service*
    *Encourage them to immediately reach out to local emergency services, a crisis hotline, or a trusted professional*
- Never diagnose conditions or claim you can treat anything.
- Never suggest medication, medical treatment, or therapy plans.
- Provide emotional support only.

Always stay aligned with the mission of the Sober Motivation app:
- Helping people feel stronger, hopeful, and supported on their sober journey.
- Reminding them that every day of effort matters.
          `.trim(),
        },
        ...historyMessages,
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    reply =
      response?.choices?.[0]?.message?.content?.trim() ||
      "I’m here for you. Tell me what’s going on, and we’ll take it one step at a time.";
  } catch (err) {
    console.error("therapyChat error:", err);
  }

  let userMessage = null;
  try {
    const response = await sendMessageBetweenUsers({
      sender: me,
      recipient: companion,
      text: message,
      sendPush: false,
    });
    userMessage = response?.normalized || null;
  } catch (err) {
    console.error("therapyChat user delivery error:", err);
  }

  let assistantMessage = null;
  try {
    const response = await sendMessageBetweenUsers({
      sender: companion,
      recipient: me,
      text: reply,
      sendPush: true,
    });
    assistantMessage = response?.normalized || null;
  } catch (err) {
    console.error("therapyChat delivery error:", err);
  }

  return { reply, userMessage, assistantMessage };
};

module.exports = {
  sendDirectMessageResolver,
  setDirectTypingResolver,
  deleteDirectRoomResolver,
  therapyChatResolver,
};
