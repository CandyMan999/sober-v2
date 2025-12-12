const mongoose = require("mongoose");
const { Quote, User } = require("../models");

require("dotenv").config();

const addQuotes = async () => {
  await mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("DB connected"))
    .catch((err) => console.log(err));

  // Optional: uncomment if you want to attach to a specific user
  // const user = await User.findOne({ token: "ExponentPushToken[sVBPscAOM1nADnm8Pn4Wct]" });

  const QUOTES = await Quote.find();
  if (QUOTES.length) {
    console.log(`Dropping existing ${QUOTES.length} quotes...`);
    await Quote.collection.drop();
  }

  // ---- same logic as resolver: tokenize + similarityScore ----
  const tokenizeQuote = (input) => {
    const normalized = (input || "")
      .toLowerCase()
      // Remove emoji and variation selectors
      .replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d\ufe0f]/gu, " ")
      // Drop punctuation and special characters so only words remain
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

    return normalized ? normalized.split(" ") : [];
  };

  const similarityScore = (aTokens, bTokens) => {
    if (!aTokens.length || !bTokens.length) {
      return 0;
    }

    const buildFrequency = (tokens) => {
      const frequencies = {};
      for (const token of tokens) {
        frequencies[token] = (frequencies[token] || 0) + 1;
      }
      return frequencies;
    };

    const aFreq = buildFrequency(aTokens);
    const bFreq = buildFrequency(bTokens);

    let overlap = 0;
    for (const token of Object.keys(aFreq)) {
      if (bFreq[token]) {
        overlap += Math.min(aFreq[token], bFreq[token]);
      }
    }

    // Sørensen–Dice coefficient
    return (2 * overlap) / (aTokens.length + bTokens.length);
  };

  const seedData = [
    "In the quiet clarity of sobriety, you finally hear what your heart has been trying to say all along. 💫",
    "Sobriety isn’t the end of fun — it’s the beginning of a life that actually feels good in the morning. ☀️",
    "Each sober day is a brick in the fortress of your unbreakable spirit. Keep stacking. 🧱",
    "Choose sobriety and watch the fog lift to reveal paths you never knew existed. 🌫️➡️🌄",
    "The greatest high is standing tall on the mountain of your own resilience — no crash, just strength. 🏔️",
    "Sobriety whispers freedom where addiction screamed chains. One day at a time, the whisper wins. 🔓",
    "Embrace the sober dawn — that’s where your authentic self rises without apology. 🌅",
    "Every sober breath is a victory. Every sober moment is a gift you actually remember unwrapping. 🎁",
    "Sobriety is your compass pointing you back to peace, purpose, and who you really are. 🧭",
    "The real power move? Reclaiming the throne of your own life and ruling it sober. 👑",
    "Sobriety turns whispers of doubt into roars of confidence. Your voice gets louder as your mind gets clearer. 🗣️",
    "A sober mind is the canvas for dreams too bold for blurred nights and forgotten plans. 🎨",
    "Choose the clear path — regrets fade, possibilities bloom, and you finally get to stay present. 🌱",
    "In sobriety you find a strength no substance could ever give you — because it was yours all along. 💪",
    "Sobriety is the key that unlocks doors you were always meant to walk through, not just stumble past. 🗝️",
    "Every sober choice writes another line in the masterpiece of your life. Keep editing in your favor. 📖",
    "Let sobriety be the light that burns away yesterday’s shadows and shows you today’s chances. 🔥",
    "The road to sobriety is paved with the gold of self-discovery and the courage to start again. ✨",
    "In sobriety you become the author of a story that doesn’t end in chaos, but in quiet triumph.",
    "Sobriety isn’t sacrifice — it’s the ultimate act of self-love and future-you gratitude. ❤️",
    "Wake up sober and let clarity fuel the fire behind everything you want to build. 🚀",
    "The beauty of sobriety shines brightest in the quiet moments you used to run from. Now you can sit still. 🌙",
    "Choose sobriety and harvest health, joy, and connections that don’t disappear at last call. 🌾",
    "Sobriety is the bridge from barely surviving to actually thriving — one step, one day, one breath.",
    "In the garden of sobriety, patience plants seeds that bloom into peace you don’t have to earn back. 🌷",
    "Let sobriety be your shield when the storm of temptation rolls in. You’ve weathered worse and survived. ⛅",
    "A sober heart beats stronger — full of real connection, real laughter, and real joy. 💓",
    "Sobriety doesn’t create a new warrior; it reveals the warrior you already were under the haze. 🛡️",
    "Dance freely in the rain of life’s possibilities — sober, unshackled, and fully awake. 💃",
    "The path of sobriety is lined with milestones you’ll look back on with fierce pride. Keep going. 🛣️",
    "Every sober sunrise is a promise that today you get to choose differently — and better. 🌄",
    "Sobriety is the silent revolution that changes everything from the inside out. No announcement, just results.",
    "Choose sober — authenticity over illusion, every single time. The real you is more than enough. 🌟",
    "The strength you build in sobriety becomes the foundation for empires of the soul, not just moments of escape.",
    "Let sobriety be the melody that finally brings your whole life into harmony. 🎶",
    "In the kingdom of sobriety, you sit on the throne of your own destiny — no substance holds the crown. 👑",
    "Sobriety turns the page to renewal and endless new horizons you can actually walk toward.",
    "Your inner light burns brightest through the clear lens of sobriety. No more dimmer switch. 💡",
    "The gift of sobriety is a life lived wide awake, fully alive, and finally honest with yourself.",
    "Sobriety is the anchor that keeps you steady when the world spins and old habits try to pull you under. ⚓",
    "Choose sobriety and unlock strengths you didn’t even know were locked inside you. 🔐",
    "In sobriety, gratitude flows like a river and quietly waters every dry place in your life. 🌊",
    "The sober journey is woven with threads of courage, hope, and quiet power that no blackout can erase.",
    "Let sobriety spark the passion you were born to live out — not just talk about. 🔥",
    "Sobriety turns burdens into blessings — one clear choice, one clear day at a time.",
    "Embrace the sober you — where true freedom finally gets to dance without losing its balance. 🕺",
    "In the silence of sobriety, you can finally hear the wisdom of your unbreakable soul. 🧘",
    "Sobriety is the foundation on which lasting dreams are built, not just imagined.",
    "Choose sobriety today and watch your life slowly unfold into something you’re proud to wake up in. 🌅",
    "The essence of sobriety is choosing yourself — not once, but over and over, every single day. 💙",
  ];

  // We'll track what we insert in this run to avoid near-duplicates
  const existingQuotes = [];

  let createdCount = 0;

  for (let i = 0; i < seedData.length; i++) {
    const rawText = seedData[i];
    const normalized = (rawText || "").trim();

    if (!normalized.length) {
      console.log(`Skipping empty quote at index ${i}`);
      continue;
    }

    const newTokens = tokenizeQuote(normalized);
    if (!newTokens.length) {
      console.log(
        `Skipping quote with no usable tokens at index ${i}: "${normalized}"`
      );
      continue;
    }

    // Compare to quotes we've already added in this seed run
    let isSimilar = false;
    for (const existing of existingQuotes) {
      const existingTokens = tokenizeQuote(existing.text);
      if (!existingTokens.length) continue;

      const score = similarityScore(newTokens, existingTokens);
      if (score >= 0.8) {
        console.log(
          `Skipping similar quote (score ${score.toFixed(
            2
          )}): "${normalized}" ~ "${existing.text}"`
        );
        isSimilar = true;
        break;
      }
    }

    if (isSimilar) {
      continue;
    }

    const data = await Quote.create({
      text: normalized,
      // user,        // ← uncomment if you want to assign to a user
      isApproved: true,
    });

    existingQuotes.push({ text: normalized });
    createdCount += 1;
    console.log(createdCount, data.text);
  }

  console.log(
    `Successfully seeded ${createdCount} quotes (from ${seedData.length} candidates)!`
  );
  process.exit(0);
};

addQuotes();
