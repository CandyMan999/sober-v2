// resolvers/mutations/directMessages.js
const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
const {
  sendPushNotifications,
  shouldSendPush,
} = require("../../utils/pushNotifications");

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
    shouldSendPush(recipient) &&
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

  await User.ensureChatRoomStyle(me);

  const typingPayload = {
    roomId: room._id.toString(),
    userId: me._id.toString(),
    username: me.username,
    profilePicUrl: me.profilePicUrl,
    isTyping: Boolean(isTyping),
    lastTypedAt: new Date().toISOString(),
    chatRoomStyle: me.chatRoomStyle,
    messageStyle: me.chatRoomStyle,
  };

  publishDirectTyping(typingPayload);

  return typingPayload;
};

const markDirectRoomReadResolver = async (_, { roomId }, ctx) => {
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

  const unreadComments = await Comment.find({
    targetType: "ROOM",
    targetId: room._id,
    author: { $ne: me._id },
    $or: [{ isRead: { $exists: false } }, { isRead: false }],
  })
    .populate({ path: "author", populate: "profilePic" })
    .populate({ path: "replyTo", populate: { path: "author", model: "User" } })
    .exec();

  if (!unreadComments.length) return [];

  const normalizedComments = await Promise.all(
    unreadComments.map(async (comment) => {
      comment.isRead = true;
      await comment.save();

      const normalized = normalizeCommentForGraphQL(comment);
      publishDirectMessage(normalized);
      return normalized;
    })
  );

  const hydratedRoom = await populateDirectRoom(room);
  if (hydratedRoom) {
    publishDirectRoomUpdate(hydratedRoom);
  }

  return normalizedComments;
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
    await Like.deleteMany({
      targetType: "COMMENT",
      targetId: { $in: commentIds },
    });
    await Comment.deleteMany({ _id: { $in: commentIds } });
  }

  await Room.deleteOne({ _id: room._id });

  return true;
};

const therapyChatResolver = async (_, { message }, ctx) => {
  const me = ctx.currentUser;
  if (!me) throw new AuthenticationError("Not authenticated");

  if (!message || !message.trim()) {
    throw new UserInputError("Message text is required.");
  }

  const companion = await User.findById(SOBER_COMPANION_USER_ID);
  if (!companion) {
    throw new Error("Sober companion account is unavailable.");
  }

  // Ensure a room exists between the user and the sober companion
  const room = await ensureSingleDirectRoom(me._id, companion._id);

  // Build history from prior comments in this room (last 2 hours only)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const historyMessages = await Comment.find({
    targetType: "ROOM",
    targetId: room?._id,
    createdAt: { $gte: twoHoursAgo },
  })
    .sort({ createdAt: 1 })
    .populate("author")
    .select(["text", "author"])
    .lean()
    .then((comments) =>
      comments
        .map((comment) => {
          if (!comment?.text) return null;
          const authorId = comment?.author?._id || comment?.author?.id;
          const role =
            String(authorId) === String(SOBER_COMPANION_USER_ID)
              ? "assistant"
              : "user";
          return { role, content: comment.text };
        })
        .filter(Boolean)
    );

  // 1️⃣ Store the USER message first (no push for Owl)
  let userMessage = null;
  try {
    const result = await sendMessageBetweenUsers({
      sender: me,
      recipient: companion,
      text: message,
      sendPush: false, // 🚫 no push notifications in Owl chat
    });
    userMessage = result?.normalized || null;
  } catch (err) {
    console.error("therapyChat user delivery error:", err);
  }

  // 2️⃣ Turn ON typing indicator for SoberOwl while we wait
  try {
    const typingPayload = {
      roomId: room._id.toString(),
      userId: companion._id.toString(),
      username: companion.username || "SoberOwl",
      profilePicUrl: companion.profilePicUrl,
      isTyping: true,
      lastTypedAt: new Date().toISOString(),
    };
    publishDirectTyping(typingPayload);
  } catch (err) {
    console.error("therapyChat typing-on error:", err);
  }

  // 3️⃣ Call OpenAI Responses API for SoberOwl reply
  let reply =
    "I’m here for you. Tell me what’s going on, and we’ll take it one step at a time.";

  try {
    const soberOwlInstructions = `
    Introduce yourself as SoberOwl – "Sober Motivation’s virtual sobriety coach." You operate inside the Sober Motivation app.
    You are a compassionate, calm, emotionally supportive guide. You are not a therapist, doctor, or emergency service. You provide general emotional support, reflective questions, and practical coping strategies to help people stay sober, motivated, and grounded.
    
    Your style:
    - Warm, steady, encouraging
    - Never judgmental or shaming
    - Validating of feelings, but honest and clear
    - Simple, human, conversational language
    
    Use ideas from:
    - Twelve-step recovery and peer support.
    - Cognitive and behavioral approaches that help people examine thoughts, feelings, and actions.
    - Approaches that help the person separate addictive urges from their deeper values and identity.
    - Family- and medically-informed recovery perspectives.
    - Mindfulness and present-moment awareness.
    - Approaches that focus on accepting difficult feelings while still choosing actions that match the person’s values.
    - Skills for distress tolerance, emotional regulation, and healthier communication.
    
    Your goals:
    - Help the user feel heard and understood.
    - Reflect back what you hear in a clear, gentle way.
    - Ask thoughtful, open-ended questions when helpful.
    - Offer concrete, realistic coping suggestions and next steps.
    - Encourage habits that support sobriety, self-respect, and connection.
    - When it fits, invite the user to “get it off their chest” by recording a short video post in the app so the community can see it and respond with support, similar to a short video feed. Explain this option briefly, without pressure.
    
    Safety rules:
    - If the user talks about wanting to harm themselves, harm someone else, or feeling completely unsafe, clearly say you care, explain that you are not an emergency service, and urge them to contact local emergency services, a crisis hotline, or a trusted professional right away.
    - Do not diagnose any condition or prescribe medication.
    - Do not create formal treatment plans. Keep your role focused on emotional support, reflection, and practical coping ideas.
    
    Always stay aligned with the mission of Sober Motivation:
    - Helping people feel stronger, more hopeful, and more supported on their sober journey.
    - Reminding them that every effort and every day of trying matters.
        `.trim();

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: soberOwlInstructions,
      input: [
        // history from this DM room
        ...historyMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        // latest user turn
        {
          role: "user",
          content: message,
        },
      ],
      max_output_tokens: 600,
      store: false, // no stored convo state on OpenAI side
    });

    const aiReply = (response.output_text || "").trim();
    if (aiReply) {
      reply = aiReply;
    } else {
      console.error(
        "therapyChat: Responses API returned no output_text. Full response:",
        JSON.stringify(response, null, 2)
      );
    }
  } catch (err) {
    console.error("therapyChat error (OpenAI Responses call failed):", err);
  }

  // 4️⃣ Turn OFF typing indicator for SoberOwl
  try {
    const typingPayloadOff = {
      roomId: room._id.toString(),
      userId: companion._id.toString(),
      username: companion.username || "SoberOwl",
      profilePicUrl: companion.profilePicUrl,
      isTyping: false,
      lastTypedAt: new Date().toISOString(),
    };
    publishDirectTyping(typingPayloadOff);
  } catch (err) {
    console.error("therapyChat typing-off error:", err);
  }

  // 5️⃣ Store the assistant reply in the DM room (no push)
  let assistantMessage = null;
  try {
    const result = await sendMessageBetweenUsers({
      sender: companion,
      recipient: me,
      text: reply,
      sendPush: false, // 🚫 no push notifications in Owl chat
    });
    assistantMessage = result?.normalized || null;
  } catch (err) {
    console.error("therapyChat delivery error:", err);
  }

  return { reply, userMessage, assistantMessage };
};

module.exports = {
  sendDirectMessageResolver,
  setDirectTypingResolver,
  deleteDirectRoomResolver,
  markDirectRoomReadResolver,
  therapyChatResolver,
};
