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

// 👇 classic GraphQL Playground middleware
const playground = require("graphql-playground-middleware-express").default;

const PORT = process.env.PORT || 4000;

const buildContext = async (token) => {
  let currentUser = null;

  if (token) {
    try {
      currentUser = await User.findOne({ token }).populate("profilePic");
      await User.ensureChatRoomStyle(currentUser);
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
      // we won't rely on Apollo's own landing page anymore
      playground: false,
      context: async ({ req }) => {
        const token = req.headers["x-push-token"] || null;
        return buildContext(token);
      },
    });

    await server.start();

    // 👇 keep file uploads enabled (no changes here)
    app.use(
      graphqlUploadExpress({
        maxFileSize: 200 * 1024 * 1024, // 200MB
        maxFiles: 1,
      })
    );

    // 👇 mount classic GraphQL Playground at /playground
    app.get(
      "/playground",
      playground({
        endpoint: "/graphql",
      })
    );

    // Apollo GraphQL endpoint
    server.applyMiddleware({ app, path: "/graphql" });

    // Subscriptions server (ws://)
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

    console.log(
      `🚀 HTTP GraphQL ready at   http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(
      `🧪 The Original Playground ready at http://localhost:${PORT}/playground`
    );
  } catch (err) {
    console.error("❌ Error starting server:", err);
  }
}

start();
