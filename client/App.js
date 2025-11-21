// App.js
import React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { GRAPHQL_URI } from "./config/endpoint";

import { TabNavigator } from "./navigation";
import {
  AddUserNameScreen,
  AddPhotoScreen,
  AddSobrietyDateScreen,
  LocationPermissionScreen,
} from "./pages";

const Stack = createStackNavigator();

// --- Apollo Client instance ---
const client = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URI }),
  cache: new InMemoryCache(),
});

export default function App() {
  return (
    <ApolloProvider client={client}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: true,
              }}
            >
              <Stack.Screen
                name="AddUserName"
                component={AddUserNameScreen}
                options={{ title: "Choose a Username" }}
              />
              <Stack.Screen
                name="AddPhoto"
                component={AddPhotoScreen}
                options={{ title: "Add Profile Photo" }}
              />
              <Stack.Screen
                name="AddSobrietyDate"
                component={AddSobrietyDateScreen}
                options={{ title: "Set Sobriety Date" }}
              />
              <Stack.Screen
                name="LocationPermission"
                component={LocationPermissionScreen}
                options={{ title: "Location Permission" }}
              />
              {/* 👇 NEW: Main app shell route the app can navigate to */}
              <Stack.Screen
                name="MainTabs"
                component={TabNavigator}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ApolloProvider>
  );
}
