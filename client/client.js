// client.js
import { GraphQLClient } from "graphql-request";
import { extractFiles } from "extract-files";
import { getAppleId, getToken } from "./utils/helpers";
import { GRAPHQL_URI } from "./config/endpoint";

console.log("📡 GraphQLClient URI:", GRAPHQL_URI);

// single underlying client
const graphQLClient = new GraphQLClient(GRAPHQL_URI);

// single, stable wrapper object
const client = {
  // keep API the same: client.request(...)
  request: async (query, variables) => {
    try {
      const token = await getToken(); // <- async storage read
      const appleId = await getAppleId();

      const headers = {
        "x-push-token": token || "",
        "x-apple-id": appleId || "",
      };

      // Detect extractable files (ReactNativeFile, Blob, etc.)
      const operation = { query, variables };
      const { clone, files } = extractFiles(operation);

      if (files.size > 0) {
        const form = new FormData();
        form.append("operations", JSON.stringify(clone));

        const map = {};
        let fileIndex = 0;
        files.forEach((paths) => {
          map[++fileIndex] = paths;
        });
        form.append("map", JSON.stringify(map));

        fileIndex = 0;
        files.forEach((_, file) => {
          form.append(`${++fileIndex}`, file);
        });

        const response = await fetch(GRAPHQL_URI, {
          method: "POST",
          headers,
          body: form,
        });

        const json = await response.json();

        if (json.errors && json.errors.length > 0) {
          const error = new Error(json.errors[0].message);
          error.response = json;
          throw error;
        }

        return json.data;
      }

      // No files? fall back to JSON POST via graphql-request
      graphQLClient.setHeaders(headers);
      return graphQLClient.request(query, variables);
    } catch (err) {
      console.log("GraphQL request error:", err);
      throw err;
    }
  },
};

// “Hook” stays the same from the caller’s POV, but
// always returns the same object reference now.
export const useClient = () => client;
