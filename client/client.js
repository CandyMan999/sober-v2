// client.js
import { GraphQLClient } from "graphql-request";
import { getToken } from "./utils/helpers";
import { GRAPHQL_URI } from "./config/endpoint";

console.log("📡 GraphQLClient URI:", GRAPHQL_URI);

// single underlying client
const graphQLClient = new GraphQLClient(GRAPHQL_URI);

export const useClient = () => {
  return {
    // keep API the same: client.request(...)
    request: async (query, variables) => {
      try {
        const token = await getToken(); // <- async storage read

        // attach token to headers for this request
        graphQLClient.setHeader("x-push-token", token || "");

        // forward to real graphql-request client
        return graphQLClient.request(query, variables);
      } catch (err) {
        console.log("GraphQL request error:", err);
        throw err;
      }
    },
  };
};
