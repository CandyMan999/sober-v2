// App.js
import React, { useReducer, useContext, useEffect, useRef } from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { WebSocketLink } from "@apollo/client/link/ws";
import { setContext } from "@apollo/client/link/context";
import { getMainDefinition } from "@apollo/client/utilities";

import * as Notifications from "expo-notifications";

import { GRAPHQL_URI } from "./config/endpoint";
import { getToken } from "./utils/helpers";

import { TabNavigator } from "./navigation";
import {
  AddUserNameScreen,
  AddPhotoScreen,
  AddSobrietyDateScreen,
  LocationPermissionScreen,
} from "./screens/Onboarding";
import UserProfileScreen from "./screens/Profile/UserProfileScreen";
import FollowersScreen from "./screens/Profile/FollowersScreen";
import FollowingScreen from "./screens/Profile/FollowingScreen";
import BuddiesScreen from "./screens/Profile/BuddiesScreen";
import LikesScreen from "./screens/Profile/LikesScreen";
import NotificationsScreen from "./screens/Profile/NotificationsScreen";
import NotificationSettingsScreen from "./screens/Profile/NotificationSettingsScreen";
import DirectMessageScreen from "./screens/DirectMessage/DirectMessageScreen";
import MessageListScreen from "./screens/DirectMessage/MessageListScreen";

import Context from "./context";
import reducer from "./reducer";

const Stack = createStackNavigator();

// --- Apollo Client instance with subscriptions ---
const httpLink = new HttpLink({ uri: GRAPHQL_URI });

const authLink = setContext(async (_, { headers }) => {
  const token = await getToken();
  return {
    headers: {
      ...headers,
      "x-push-token": token || "",
    },
  };
});

const wsLink = new WebSocketLink({
  uri: GRAPHQL_URI.replace(/^http/, "ws"),
  options: {
    reconnect: true,
    connectionParams: async () => ({
      "x-push-token": (await getToken()) || "",
    }),
  },
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

// If you already set a notification handler somewhere else, you can delete this.
// This is just a sane default so notifications show while app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // shows banner while app is foregrounded
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  // use your context default as initial state
  const initialState = useContext(Context);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Notification listeners
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Fired whenever a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Optional: if you want to update global state when a notification arrives:
        // dispatch({ type: "NOTIFICATION_RECEIVED", payload: notification });
      });

    // Fired whenever a user taps on a notification (foreground, background, or killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Later: you can navigate or update state here.
        // Example shape:
        // const data = response.notification.request.content.data;
        // if (data?.screen === "SomeScreen") {
        //   // Use a navigation ref to jump to a screen if you want
        // }
      });

    // Cleanup on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <ApolloProvider client={client}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Context.Provider value={{ state, dispatch }}>
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
                {/* Main app shell */}
                <Stack.Screen
                  name="MainTabs"
                  component={TabNavigator}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="UserProfile"
                  component={UserProfileScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Followers"
                  component={FollowersScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Following"
                  component={FollowingScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Buddies"
                  component={BuddiesScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Likes"
                  component={LikesScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Notifications"
                  component={NotificationsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="NotificationSettings"
                  component={NotificationSettingsScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Messages"
                  component={MessageListScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="DirectMessage"
                  component={DirectMessageScreen}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            </NavigationContainer>
            <Toast />
          </Context.Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ApolloProvider>
  );
}
