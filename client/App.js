// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";

// Apollo Client v4 friendly imports
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";

import { TabNavigator } from "./tabs"; // default export TabNavigator

// For now: hard-code local dev server
const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost:4000/graphql",
  }),
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
