// client.js
import { GraphQLClient } from "graphql-request";
import { GRAPHQL_URI } from "./config/endpoint"; // <-- import from App.js

console.log("📡 GraphQLClient URI:", GRAPHQL_URI);

const graphQLClient = new GraphQLClient(GRAPHQL_URI);

export const useClient = () => graphQLClient;
