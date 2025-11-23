import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import {
  Feather,
  AntDesign,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useNavigationState } from "@react-navigation/native";

import HomeTabs from "./HomeTabs";
import ChatTabs from "./ChatTabs";
import SoberTimeScreen from "../screens/Sober/SoberTimeScreen";
import PostCaptureScreen from "../screens/Post/PostCaptureScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import AddQuoteScreen from "../screens/Home/AddQuoteScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ChatStack = createStackNavigator();

const ACTIVE_COLOR = "#F59E0B";
const INACTIVE_COLOR = "#6b7280";

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

const getDeepActiveRoute = (state) => {
  if (!state || !state.routes || state.index == null) return null;

  const route = state.routes[state.index];
  return route.state ? getDeepActiveRoute(route.state) : route;
};

// Custom circular post button that flattens when Chat is active
const CustomPostButton = ({ focused }) => {
  const tabState = useNavigationState((state) => state);
  const activeRouteName = tabState?.routes?.[tabState.index]?.name;
  const chatActive = activeRouteName === "Chat";

  const wrapperStyle = [
    styles.postWrapper,
    chatActive && styles.postWrapperFlat,
  ];
  const haloStyle = [styles.postHalo, chatActive && styles.postHaloFlat];
  const centerStyle = [styles.postCenter, chatActive && styles.postCenterSmall];

  return (
    <View style={wrapperStyle}>
      {!chatActive && <View style={haloStyle} />}
      <LinearGradient
        colors={focused ? ["#FBBF24", "#F59E0B"] : ["#F59E0B", "#FBBF24"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={centerStyle}
      >
        <AntDesign
          name="plus"
          size={chatActive ? 22 : focused ? 30 : 26}
          color="#111827"
        />
      </LinearGradient>
    </View>
  );
};

const PlusTabButton = (props) => {
  const navigation = useNavigation();
  const tabState = useNavigationState((state) => state);
  const activeLeafRoute = getDeepActiveRoute(tabState);
  const isQuotesActive = activeLeafRoute?.name === "Quotes";

  const handlePress = () => {
    if (isQuotesActive) {
      navigation.navigate("AddQuote");
    } else {
      navigation.navigate("Post");
    }
  };

  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.85}
      onPress={handlePress}
      style={{ top: -10 }}
    >
      <CustomPostButton focused={props?.accessibilityState?.selected} />
    </TouchableOpacity>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: "#050816",
          borderTopColor: "#1f2937",
          height: 68,
        },
      }}
    >
      <Tab.Screen
        name="HomeTabRoot"
        component={HomeStackScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused, color }) => (
            <Feather
              name="home"
              size={focused ? 30 : 24}
              color={focused ? ACTIVE_COLOR : color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="SoberTime"
        component={SoberTimeScreen}
        options={{
          tabBarLabel: "Sober",
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name="progress-clock"
              size={focused ? 30 : 24}
              color={focused ? ACTIVE_COLOR : color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Post"
        component={PostCaptureScreen}
        options={{
          tabBarLabel: "",
          tabBarButton: (props) => <PlusTabButton {...props} />,
          tabBarStyle: { display: "none" },
        }}
      />

      <Tab.Screen
        name="AddQuote"
        component={AddQuoteScreen}
        options={{
          tabBarItemStyle: { display: "none" },
          tabBarButton: () => null,
          tabBarStyle: { display: "none" },
        }}
      />

      <Tab.Screen
        name="Chat"
        component={ChatStackScreen}
        options={{
          tabBarLabel: "Chat",
          tabBarIcon: ({ focused, color }) => (
            <View style={{ width: 40, alignItems: "center" }}>
              <FontAwesome5
                name="comments"
                size={focused ? 30 : 24}
                color={focused ? ACTIVE_COLOR : color}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Feather
              name="user"
              size={focused ? 30 : 24}
              color={focused ? ACTIVE_COLOR : color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  // default: big, lifted post button
  postWrapper: {
    width: 58,
    height: 58,
    justifyContent: "center",
    alignItems: "center",
    top: -15,
  },
  postHalo: {
    position: "absolute",
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.5)",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
  postCenter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  // when Chat is active: shrink + flatten
  postWrapperFlat: {
    top: 0,
    width: 40,
    height: 40,
    marginTop: 18,
  },
  postHaloFlat: {
    opacity: 0,
  },
  postCenterSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default TabNavigator;
