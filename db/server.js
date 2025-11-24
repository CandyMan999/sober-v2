// server.js
const { ApolloServer } = require("apollo-server");
const mongoose = require("mongoose");
const { typeDefs, resolvers } = require("./graphQL");
const { User } = require("./models");
const { cronJob } = require("./utils/cronJob");
require("dotenv").config();

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true,
      playground: true,
      uploads: true,

      // 👇 attach logged-in user via Expo token
      context: async ({ req }) => {
        const token = req.headers["x-push-token"] || null;
        let currentUser = null;

        if (token) {
          try {
            currentUser = await User.findOne({ token }).populate("profilePic");
          } catch (err) {
            console.error("❌ Error fetching user from token:", err);
          }
        }

        return {
          token, // always useful
          currentUser,
        };
      },
    });

    const { url } = await server.listen(PORT);
    cronJob();
    console.log(`🚀 Server ready at ${url}`);
  } catch (err) {
    console.error("❌ Error starting server:", err);
  }
}

start();
