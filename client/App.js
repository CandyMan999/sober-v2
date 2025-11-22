// App.js
import React, { useReducer, useContext, useEffect, useRef } from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";

import * as Notifications from "expo-notifications";

import { GRAPHQL_URI } from "./config/endpoint";

import { TabNavigator } from "./navigation";
import {
  AddUserNameScreen,
  AddPhotoScreen,
  AddSobrietyDateScreen,
  LocationPermissionScreen,
} from "./pages";

import Context from "./context";
import reducer from "./reducer";

const Stack = createStackNavigator();

// --- Apollo Client instance ---
const client = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URI }),
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
        console.log("Notification received (foreground):", notification);

        // Optional: if you want to update global state when a notification arrives:
        // dispatch({ type: "NOTIFICATION_RECEIVED", payload: notification });
      });

    // Fired whenever a user taps on a notification (foreground, background, or killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification interaction:", response);

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
              </Stack.Navigator>
            </NavigationContainer>
          </Context.Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ApolloProvider>
  );
}
