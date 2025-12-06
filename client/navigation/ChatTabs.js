import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { SubscriptionClient } from "subscriptions-transport-ws";

import ChatRoomScreen from "../screens/Chat/ChatRoomScreen";
import Context from "../context";
import { useClient } from "../client";
import {
  GET_ROOMS,
  LEAVE_ALL_ROOMS,
  ROOMS_UPDATED_SUBSCRIPTION,
} from "../GraphQL/chatRooms";
import { GRAPHQL_URI } from "../config/endpoint";

const TopTab = createMaterialTopTabNavigator();

// Simple metadata for subtitles
const ROOM_META = {
  General: {
    description: "Main chat",
  },
  "Early Days": {
    description: "Day 1–30",
  },
  "Relapse Support": {
    description: "Support & resets",
  },
};

const PulsingDot = () => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.onlineDot,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

const ChatTabs = () => {
  const { state } = React.useContext(Context);
  const client = useClient();
  const [roomCounts, setRoomCounts] = useState({});
  const userId = state?.user?.id;

  const buildWsUrl = useCallback(() => GRAPHQL_URI.replace(/^http/, "ws"), []);

  const updateCountsFromRooms = useCallback((rooms = []) => {
    const nextCounts = {};
    rooms.forEach((room) => {
      if (!room?.name) return;
      nextCounts[room.name] = Array.isArray(room.users) ? room.users.length : 0;
    });
    setRoomCounts(nextCounts);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadRooms = async () => {
      try {
        const response = await client.request(GET_ROOMS);
        if (!isMounted) return;
        updateCountsFromRooms(response?.getRooms || []);
      } catch (error) {
        console.log("Failed to load rooms", error);
      }
    };

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, [client, updateCountsFromRooms]);

  useEffect(() => {
    const wsUrl = buildWsUrl();
    let wsClient;

    try {
      wsClient = new SubscriptionClient(wsUrl, { reconnect: true });
    } catch (error) {
      console.log("Failed to init rooms subscription", error);
      return undefined;
    }

    const observable = wsClient.request({ query: ROOMS_UPDATED_SUBSCRIPTION });
    const subscription = observable.subscribe({
      next: ({ data }) => {
        const rooms = data?.roomsUpdated;
        if (!rooms) return;
        updateCountsFromRooms(rooms);
      },
      error: (error) => console.log("Rooms subscription error", error),
    });

    return () => {
      subscription?.unsubscribe?.();
      wsClient?.close?.();
    };
  }, [buildWsUrl, updateCountsFromRooms]);

  const leaveRooms = useCallback(async () => {
    if (!userId) return;
    try {
      await client.request(LEAVE_ALL_ROOMS, { userId });
    } catch (error) {
      console.log("Failed to leave rooms", error);
    }
  }, [client, userId]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        leaveRooms();
      };
    }, [leaveRooms])
  );

  const tabLabel = useCallback(
    ({ route, color, focused }) => {
      const count = roomCounts[route.name] ?? 0;
      const hasPeople = count > 0;
      const meta = ROOM_META[route.name] || {};
      const baseDescription = meta.description || "Chat room";
      const statusText = hasPeople ? `${count} online` : "Quiet right now";

      return (
        <View style={styles.tabLabelContainer}>
          <View style={styles.tabTitleRow}>
            <Text
              style={[
                styles.tabLabel,
                focused ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
              numberOfLines={1}
            >
              {route.name}
            </Text>
            {hasPeople && <PulsingDot />}
          </View>
          <Text
            style={[
              styles.tabSubtitle,
              focused ? styles.tabSubtitleActive : styles.tabSubtitleInactive,
            ]}
            numberOfLines={1}
          >
            {statusText} • {baseDescription}
          </Text>
        </View>
      );
    },
    [roomCounts]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#050816" }}
        edges={["top", "left", "right"]}
      >
        <TopTab.Navigator
          sceneContainerStyle={{ backgroundColor: "#0b1220" }}
          screenOptions={({ route }) => ({
            // Original style: underline only under active tab
            tabBarIndicatorStyle: { backgroundColor: "#f59e0b", height: 3 },
            tabBarStyle: {
              backgroundColor: "#050816",
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
            tabBarActiveTintColor: "#fff",
            tabBarInactiveTintColor: "#9ca3af",
            tabBarScrollEnabled: true,
            tabBarItemStyle: { width: 180 },
            tabBarLabelStyle: { fontWeight: "700" },
            tabBarLabel: ({ color, focused }) =>
              tabLabel({ route, color, focused }),
          })}
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
    </KeyboardAvoidingView>
  );
};

export default ChatTabs;

const styles = StyleSheet.create({
  tabLabelContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  tabTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  tabLabelActive: {
    color: "#f9fafb",
  },
  tabLabelInactive: {
    color: "#9ca3af",
  },
  tabSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  tabSubtitleActive: {
    color: "#e5e7eb",
  },
  tabSubtitleInactive: {
    color: "#6b7280",
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    marginLeft: 6,
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
