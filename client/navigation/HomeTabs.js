import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import CommunityScreen from "../screens/Home/CommunityScreen";
import QuotesScreen from "../screens/Home/QuotesScreen";

const TopTab = createMaterialTopTabNavigator();

const HomeTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "transparent" }}
      edges={["left", "right"]}
    >
      <TopTab.Navigator
        sceneContainerStyle={{ backgroundColor: "#000" }}
        screenOptions={{
          tabBarIndicatorStyle: {
            backgroundColor: "#f59e0b",
            height: 3,
            borderRadius: 999,
            opacity: 1,
          },
          tabBarStyle: {
            backgroundColor: "transparent",
            borderBottomWidth: 0,
            shadowOpacity: 0,
            elevation: 0,
            position: "absolute",
            left: 0,
            right: 0,
            top: insets.top,
          },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
          tabBarLabelStyle: {
            fontWeight: "800",
            fontSize: 16,
            letterSpacing: 1,
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
