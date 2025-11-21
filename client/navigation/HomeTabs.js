import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import CommunityScreen from "../screens/Home/CommunityScreen";
import QuotesScreen from "../screens/Home/QuotesScreen";

const TopTab = createMaterialTopTabNavigator();

const HomeTabs = () => {
  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: { backgroundColor: "#f59e0b" },
        tabBarStyle: { backgroundColor: "#050816" },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <TopTab.Screen name="Community" component={CommunityScreen} />
      <TopTab.Screen name="Quotes" component={QuotesScreen} />
    </TopTab.Navigator>
  );
};

export default HomeTabs;
