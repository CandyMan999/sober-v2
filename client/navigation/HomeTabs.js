import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { SafeAreaView } from "react-native-safe-area-context";

import CommunityScreen from "../screens/Home/CommunityScreen";
import QuotesScreen from "../screens/Home/QuotesScreen";

const TopTab = createMaterialTopTabNavigator();

const HomeTabs = () => {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#050816" }}
      edges={["top", "left", "right"]}
    >
      <TopTab.Navigator
        sceneContainerStyle={{ backgroundColor: "#0b1220" }}
        screenOptions={{
          tabBarIndicatorStyle: { backgroundColor: "#f59e0b" },
          tabBarStyle: {
            backgroundColor: "rgba(5,8,22,0.4)",
            borderBottomWidth: 0,
            shadowOpacity: 0,
            elevation: 0,
          },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarLabelStyle: { fontWeight: "700" },
        }}
      >
        <TopTab.Screen name="Community" component={CommunityScreen} />
        <TopTab.Screen name="Quotes" component={QuotesScreen} />
      </TopTab.Navigator>
    </SafeAreaView>
  );
};

export default HomeTabs;
