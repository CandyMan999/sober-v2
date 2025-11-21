import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { View } from "react-native";

import ChatRoomScreen from "../screens/Chat/ChatRoomScreen";

const TopTab = createMaterialTopTabNavigator();

const ChatTabs = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#050816" }}>
      <TopTab.Navigator
        sceneContainerStyle={{ backgroundColor: "#0b1220" }}
        screenOptions={{
          tabBarIndicatorStyle: { backgroundColor: "#f59e0b" },
          tabBarStyle: { backgroundColor: "#050816" },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarLabelStyle: { fontWeight: "700" },
          tabBarScrollEnabled: true,
          tabBarItemStyle: { width: 140 },
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
    </View>
  );
};

export default ChatTabs;
