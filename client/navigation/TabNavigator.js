import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeTabs from "./HomeTabs";
import ChatTabs from "./ChatTabs";
import SoberTimeScreen from "../screens/Sober/SoberTimeScreen";
import PostCaptureScreen from "../screens/Post/PostCaptureScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";

const Tab = createBottomTabNavigator();

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
        name="Home"
        component={HomeTabs}
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
        component={ChatTabs}
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
