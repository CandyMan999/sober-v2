import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import ChatRoomScreen from "../screens/Chat/ChatRoomScreen";

const TopTab = createMaterialTopTabNavigator();

const ChatTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={{ flex: 1, paddingTop: insets.top, backgroundColor: "#050816" }}
      edges={["top"]}
    >
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
    </SafeAreaView>
  );
};

export default ChatTabs;
