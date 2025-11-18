// server.js
const { ApolloServer } = require("apollo-server");
const mongoose = require("mongoose");
const { typeDefs, resolvers } = require("./graphQL");
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
    });

    const { url } = await server.listen(PORT);
    console.log(`🚀 Server ready at ${url}`);
  } catch (err) {
    console.error("❌ Error starting server:", err);
  }
}

start();
