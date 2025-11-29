// server.js
const express = require("express");
const http = require("http");
const { ApolloServer } = require("apollo-server-express");
const { execute, subscribe } = require("graphql");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { graphqlUploadExpress } = require("graphql-upload-minimal");
const mongoose = require("mongoose");
const { typeDefs, resolvers } = require("./graphQL");
const { User } = require("./models");
const { cronJob } = require("./utils/cronJob");
require("dotenv").config();

const PORT = process.env.PORT || 4000;

const buildContext = async (token) => {
  let currentUser = null;

  if (token) {
    try {
      currentUser = await User.findOne({ token }).populate("profilePic");
    } catch (err) {
      console.error("❌ Error fetching user from token:", err);
    }
  }

  return { token, currentUser };
};

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const app = express();
    const httpServer = http.createServer(app);
    const schema = makeExecutableSchema({ typeDefs, resolvers });

    const server = new ApolloServer({
      schema,
      introspection: true,
      playground: true,

      // 👇 attach logged-in user via Expo token
      context: async ({ req }) => {
        const token = req.headers["x-push-token"] || null;
        return buildContext(token);
      },
    });

    await server.start();

    app.use(
      graphqlUploadExpress({
        maxFileSize: 200 * 1024 * 1024, // 200MB
        maxFiles: 1,
      })
    );

    server.applyMiddleware({ app, path: "/graphql" });

    SubscriptionServer.create(
      {
        schema,
        execute,
        subscribe,
        onConnect: async (connectionParams) => {
          const token =
            connectionParams?.["x-push-token"] ||
            connectionParams?.headers?.["x-push-token"] ||
            null;

          return buildContext(token);
        },
      },
      {
        server: httpServer,
        path: server.graphqlPath,
      }
    );

    await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

    cronJob();
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  } catch (err) {
    console.error("❌ Error starting server:", err);
  }
}

start();
