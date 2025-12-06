import React, { useCallback, useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
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
    ({ route, color }) => {
      const count = roomCounts[route.name] ?? 0;
      return (
        <View style={styles.tabLabelContainer}>
          <Text style={[styles.tabCount, { color }]}>{count}</Text>
          <Text style={[styles.tabLabel, { color }]}>{route.name}</Text>
        </View>
      );
    },
    [roomCounts]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#050816" }}
      edges={["top", "left", "right"]}
    >
      <TopTab.Navigator
        sceneContainerStyle={{ backgroundColor: "#0b1220" }}
        screenOptions={({ route }) => ({
          tabBarIndicatorStyle: { backgroundColor: "#f59e0b", height: 3 },
          tabBarStyle: { backgroundColor: "#050816" },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarLabelStyle: { fontWeight: "700" },
          tabBarScrollEnabled: true,
          tabBarItemStyle: { width: 140 },
          tabBarLabel: ({ color }) => tabLabel({ route, color }),
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
  );
};

export default ChatTabs;

const styles = StyleSheet.create({
  tabLabelContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabCount: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
});
