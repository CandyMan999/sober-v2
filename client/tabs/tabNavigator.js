// tabs/tabNavigator.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import {
  AddUserNameScreen,
  AddPhotoScreen,
  AddSobrietyDateScreen,
  LocationPermissionScreen,
  HomeScreen,
} from "../pages";

const Stack = createStackNavigator();

function TabNavigator() {
  return (
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
      {/* 👇 NEW: Home route the app can navigate to */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
    </Stack.Navigator>
  );
}

export default TabNavigator;
