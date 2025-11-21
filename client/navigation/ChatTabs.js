import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import ChatRoomScreen from "../screens/Chat/ChatRoomScreen";

const TopTab = createMaterialTopTabNavigator();

const ChatTabs = () => {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: { backgroundColor: "#f59e0b" },
        tabBarStyle: { backgroundColor: "#050816" },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <TopTab.Screen
        name="General"
        component={ChatRoomScreen}
        initialParams={{ roomName: "General" }}
      />
      <TopTab.Screen
        name="Early Days"
        component={ChatRoomScreen}
        initialParams={{ roomName: "Early Days" }}
      />
      <TopTab.Screen
        name="Relapse Support"
        component={ChatRoomScreen}
        initialParams={{ roomName: "Relapse Support" }}
      />
    </TopTab.Navigator>
  );
};

export default ChatTabs;
