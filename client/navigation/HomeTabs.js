import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { SafeAreaView } from "react-native-safe-area-context";

import CommunityScreen from "../screens/Home/CommunityScreen";
import QuotesScreen from "../screens/Home/QuotesScreen";

const TopTab = createMaterialTopTabNavigator();

const HomeTabs = () => {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "transparent" }}
      edges={["left", "right"]}
    >
      <TopTab.Navigator
        sceneContainerStyle={{ backgroundColor: "#000" }}
        screenOptions={{
          tabBarIndicatorStyle: {
            backgroundColor: "#fff",
            height: 3,
            borderRadius: 999,
            opacity: 0.9,
          },
          tabBarStyle: {
            backgroundColor: "rgba(0,0,0,0.1)",
            borderBottomWidth: 0,
            shadowOpacity: 0,
            elevation: 0,
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
          },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
          tabBarLabelStyle: {
            fontWeight: "700",
            fontSize: 16,
            letterSpacing: 0.5,
            textTransform: "none",
          },
          tabBarPressColor: "transparent",
        }}
      >
        <TopTab.Screen name="Community" component={CommunityScreen} />
        <TopTab.Screen name="Quotes" component={QuotesScreen} />
      </TopTab.Navigator>
    </SafeAreaView>
  );
};

export default HomeTabs;
