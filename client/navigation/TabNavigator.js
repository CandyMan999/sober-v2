import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";

import HomeTabs from "./HomeTabs";
import ChatTabs from "./ChatTabs";
import SoberTimeScreen from "../screens/Sober/SoberTimeScreen";
import PostCaptureScreen from "../screens/Post/PostCaptureScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ChatStack = createStackNavigator();

const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeTabs" component={HomeTabs} />
  </HomeStack.Navigator>
);

const ChatStackScreen = () => (
  <ChatStack.Navigator screenOptions={{ headerShown: false }}>
    <ChatStack.Screen name="ChatRooms" component={ChatTabs} />
  </ChatStack.Navigator>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#050816",
          borderTopColor: "#1f2937",
        },
      }}
    >
      <Tab.Screen
        name="HomeTabRoot"
        component={HomeStackScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Sober"
        component={SoberTimeScreen}
        options={{
          tabBarLabel: "Sober",
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🔥</Text>,
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostCaptureScreen}
        options={{
          tabBarLabel: "Post",
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>➕</Text>,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStackScreen}
        options={{
          tabBarLabel: "Chat",
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>💬</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
