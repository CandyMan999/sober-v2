// client.js
import { GraphQLClient } from "graphql-request";

const URI =
  process.env.NODE_ENV === "production"
    ? "https://sober-motivation.herokuapp.com/graphql"
    : "http://localhost:4000/graphql";

const graphQLClient = new GraphQLClient(URI, {});

export const useClient = () => graphQLClient;
