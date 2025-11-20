// App.js
import React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { GRAPHQL_URI } from "./config/endpoint";

import { TabNavigator } from "./tabs";




// --- Apollo Client instance ---
const client = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URI }),
  cache: new InMemoryCache(),
});

export default function App() {
  return (
    <ApolloProvider client={client}>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </ApolloProvider>
  );
}
