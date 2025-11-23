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

  const user = await User.findOne({
    token: "ExponentPushToken[sVBPscAOM1nADnm8Pn4Wct]",
  });

  console.log("user: ", user);

  const QUOTES = await Quote.find();
  if (QUOTES.length) await Quote.collection.drop();

  const seedData = [
    "I have never heard someone say they regretted getting sober, let that sink in!",
    "Let's stay sober and acheive all our Dreams!",
    "Do you really want a DUI",
    "Alcohol is a poison, there is no such thing as a normal drinker",
    "It's not worth the 3 days of feeling like shit💩",
    "Fuck alcohol!",
    "🚫🍺 One drink is never just one. You know it. I know it. Keep going.",
    "💀 Alcohol doesn’t want a relationship — it wants a hostage.",
    "🔥 You survived cravings before. You’ll survive this one too.",
    "😤 You don’t need a drink — you need a reminder of who the hell you are.",
    "🌅 Tomorrow hits different when you wake up proud instead of hungover.",
    "🧠✊ Your brain is healing. Don’t interrupt the process for a buzz that lasts 20 minutes.",
    "👑 Sobriety isn’t punishment — it’s your comeback.",
    "💸 Alcohol keeps taking. Sober life gives back.",
    "🪦 ‘Just one’ has buried dreams. Don’t let it bury yours.",
    "😂 Hangovers are just your body asking: ‘Are we really doing THIS again?’",
    "✌️ Peace > poison.",
    "💪 You don't crave the drink — you crave relief. Sobriety gives you REAL relief.",
    "🔥 Every day you don’t drink, you become someone future you will worship.",
    "🕊️ Alcohol numbs pain, but it also numbs joy. Keep choosing life.",
    "⚠️ That urge? It's withdrawal from your old life — not the truth.",
    "📈 You’re not falling behind by being sober — you’re finally catching up to your potential.",
    "🧨 One night of drinking can destroy months of progress. Not worth it. Ever.",
    "🌱 Healing is messy. Drinking is just avoiding the mess and making it worse later.",
    "❤️ Someone out there is proud of you. Even if it's just future you.",
    "🚀 Stay sober. Your next level requires clarity — not chaos.",
    "If you are a real alcoholic, you either get locked up or covered up 💀🪦",
    "Yet motherfucker, you haven't YET, keep fucking around and find out!",
  ];

  for (let i = 0; seedData.length > i; i++) {
    const data = await Quote.create({
      text: seedData[i],
      user,
      isApproved: true,
    });

    console.log(i, data);
  }

  process.exit(0);
};

addQuotes();
