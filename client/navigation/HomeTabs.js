import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { View } from "react-native";

import CommunityScreen from "../screens/Home/CommunityScreen";
import QuotesScreen from "../screens/Home/QuotesScreen";

const TopTab = createMaterialTopTabNavigator();

const HomeTabs = () => {
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
        }}
      >
        <TopTab.Screen name="Community" component={CommunityScreen} />
        <TopTab.Screen name="Quotes" component={QuotesScreen} />
      </TopTab.Navigator>
    </View>
  );
};

export default HomeTabs;
