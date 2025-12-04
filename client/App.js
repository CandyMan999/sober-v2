// App.js
import React, {
  useReducer,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { WebSocketLink } from "@apollo/client/link/ws";
import { setContext } from "@apollo/client/link/context";
import { getMainDefinition } from "@apollo/client/utilities";

import * as Notifications from "expo-notifications";

import { GRAPHQL_URI } from "./config/endpoint";
import { getToken } from "./utils/helpers";

import { TabNavigator } from "./navigation";
import {
  AddUserNameScreen,
  AddPhotoScreen,
  AddSobrietyDateScreen,
  LocationPermissionScreen,
} from "./screens/Onboarding";
import UserProfileScreen from "./screens/Profile/UserProfileScreen";
import FollowersScreen from "./screens/Profile/FollowersScreen";
import FollowingScreen from "./screens/Profile/FollowingScreen";
import BuddiesScreen from "./screens/Profile/BuddiesScreen";
import LikesScreen from "./screens/Profile/LikesScreen";
import NotificationsScreen from "./screens/Profile/NotificationsScreen";
import DirectMessageScreen from "./screens/DirectMessage/DirectMessageScreen";
import MessageListScreen from "./screens/DirectMessage/MessageListScreen";
import { ContentPreviewModal } from "./components";
import { POST_BY_ID_QUERY, QUOTE_BY_ID_QUERY } from "./GraphQL/queries";
import { useClient } from "./client";
import { NotificationIntents, NotificationTypes } from "./utils/notifications";
import { ensureSoberMotionTrackingSetup } from "./utils/locationTracking";

import Context from "./context";
import reducer from "./reducer";

const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();

// --- Apollo Client instance with subscriptions ---
const httpLink = new HttpLink({ uri: GRAPHQL_URI });

const authLink = setContext(async (_, { headers }) => {
  const token = await getToken();
  return {
    headers: {
      ...headers,
      "x-push-token": token || "",
    },
  };
});

const wsLink = new WebSocketLink({
  uri: GRAPHQL_URI.replace(/^http/, "ws"),
  options: {
    reconnect: true,
    connectionParams: async () => ({
      "x-push-token": (await getToken()) || "",
    }),
  },
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

// If you already set a notification handler somewhere else, you can delete this.
// This is just a sane default so notifications show while app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // shows banner while app is foregrounded
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  // use your context default as initial state
  const initialState = useContext(Context);
  const [state, dispatch] = useReducer(reducer, initialState);
  const graphClient = useClient();
  const [previewRequest, setPreviewRequest] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewType, setPreviewType] = useState("POST");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [previewShowComments, setPreviewShowComments] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);

  // Notification listeners
  const notificationListener = useRef();
  const responseListener = useRef();

  const closePreview = useCallback(() => {
    setPreviewVisible(false);
    setPreviewContent(null);
    setPreviewMuted(true);
    setPreviewShowComments(false);
  }, []);

  const handleNotificationNavigation = useCallback((data) => {
    setPreviewShowComments(false);

    const notificationTitle = data?.title || data?.__notificationTitle;
    const notificationBody =
      data?.message || data?.body || data?.__notificationBody;

    if (
      data?.type === NotificationTypes.MILESTONE ||
      data?.type === "milestone"
    ) {
      setPreviewType("INFO");
      setPreviewContent({
        id: data?.id || `milestone-${Date.now()}`,
        title: notificationTitle || "Sober Motivation",
        text:
          notificationBody ||
          "Milestone unlocked. Keep going—your future self will thank you.",
        day: data?.day || data?.milestoneDay,
      });
      setPreviewVisible(true);
      return;
    }

    if (data?.type === "direct_message" && data.senderId) {
      const userParam = {
        id: data.senderId,
        username: data.senderUsername || "Buddy",
        profilePicUrl: data.senderProfilePicUrl || null,
      };

      const navigateToDirectMessage = () => {
        navigationRef.navigate("DirectMessage", { user: userParam });
      };

      if (navigationRef.isReady()) {
        navigateToDirectMessage();
      } else {
        setTimeout(() => {
          if (navigationRef.isReady()) {
            navigateToDirectMessage();
          }
        }, 300);
      }
      return;
    }

    if (data?.type === "relapse_prediction") {
      const message =
        data?.message ||
        "Based on your history you usually relapse around this time. Keep going, you’ve got this.";

      setPreviewType("INFO");
      setPreviewContent({
        id: data?.id || `relapse-${Date.now()}`,
        title: "Stay strong",
        text: message,
        day: data?.day,
      });
      setPreviewVisible(true);
      return;
    }

    if (data?.type === "new_post" && data.postId) {
      setPreviewType("POST");
      setPreviewRequest({ id: data.postId, type: "POST" });
      return;
    }

    if (data?.type === NotificationTypes.NEW_QUOTE && data.quoteId) {
      setPreviewType("QUOTE");
      setPreviewRequest({ id: data.quoteId, type: "QUOTE" });
      return;
    }

    if (
      (data?.type === NotificationTypes.COMMENT_ON_POST ||
        data?.type === NotificationTypes.COMMENT_REPLY) &&
      data.postId &&
      data.intent === NotificationIntents.OPEN_POST_COMMENTS
    ) {
      setPreviewShowComments(true);
      setPreviewType("POST");
      setPreviewRequest({ id: data.postId, type: "POST" });
    }
  }, []);

  useEffect(() => {
    // Fired whenever a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Optional: if you want to update global state when a notification arrives:
        // dispatch({ type: "NOTIFICATION_RECEIVED", payload: notification });
      });

    // Fired whenever a user taps on a notification (foreground, background, or killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const content = response?.notification?.request?.content;
        const data = content?.data || {};
        handleNotificationNavigation({
          ...data,
          __notificationTitle: content?.title,
          __notificationBody: content?.body,
        });
      });

    // Cleanup on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationNavigation]);

  useEffect(() => {
    const ensureLocationTracking = async () => {
      try {
        console.log("[SoberMotion] Ensuring motion tracking setup from App.js");
        await ensureSoberMotionTrackingSetup();
      } catch (error) {
        console.log(
          "[SoberMotion] Failed to ensure motion tracking setup",
          error
        );
      }
    };

    ensureLocationTracking();
  }, []);

  useEffect(() => {
    if (!navigationReady) return undefined;

    let isActive = true;

    const loadInitialNotificationResponse = async () => {
      try {
        const lastResponse =
          await Notifications.getLastNotificationResponseAsync();
        const content = lastResponse?.notification?.request?.content;
        if (!isActive || !content) return;

        const data = content?.data || {};
        handleNotificationNavigation({
          ...data,
          __notificationTitle: content?.title,
          __notificationBody: content?.body,
        });
      } catch (err) {
        console.log("Failed to process initial notification response", err);
      }
    };

    loadInitialNotificationResponse();

    return () => {
      isActive = false;
    };
  }, [handleNotificationNavigation, navigationReady]);

  useEffect(() => {
    if (!previewRequest?.id) return undefined;

    let isActive = true;

    const loadPreview = async () => {
      try {
        const token = await getToken();
        const variables =
          previewRequest.type === "POST"
            ? { postId: previewRequest.id, token }
            : { quoteId: previewRequest.id, token };
        const query =
          previewRequest.type === "POST" ? POST_BY_ID_QUERY : QUOTE_BY_ID_QUERY;

        const result = await graphClient.request(query, variables);
        if (!isActive) return;

        const content =
          previewRequest.type === "POST" ? result?.post : result?.quote;

        if (content) {
          setPreviewContent(content);
          setPreviewVisible(true);
        } else {
          closePreview();
        }
      } catch (err) {
        console.log("Failed to open content from notification", err);
        if (isActive) {
          closePreview();
        }
      } finally {
        if (isActive) {
          setPreviewRequest(null);
        }
      }
    };

    loadPreview();

    return () => {
      isActive = false;
    };
  }, [closePreview, graphClient, previewRequest]);

  return (
    <ApolloProvider client={client}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Context.Provider value={{ state, dispatch }}>
            <NavigationContainer
              ref={navigationRef}
              onReady={() => setNavigationReady(true)}
            >
              <>
                <Stack.Navigator
                  screenOptions={{
                    headerShown: true,
                  }}
                >
                  <Stack.Screen
                    name="AddUserName"
                    component={AddUserNameScreen}
                    options={{ title: "Choose a Username" }}
                  />
                  <Stack.Screen
                    name="AddPhoto"
                    component={AddPhotoScreen}
                    options={{ title: "Add Profile Photo" }}
                  />
                  <Stack.Screen
                    name="AddSobrietyDate"
                    component={AddSobrietyDateScreen}
                    options={{ title: "Set Sobriety Date" }}
                  />
                  <Stack.Screen
                    name="LocationPermission"
                    component={LocationPermissionScreen}
                    options={{ title: "Location Permission" }}
                  />
                  {/* Main app shell */}
                  <Stack.Screen
                    name="MainTabs"
                    component={TabNavigator}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="UserProfile"
                    component={UserProfileScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Followers"
                    component={FollowersScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Following"
                    component={FollowingScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Buddies"
                    component={BuddiesScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Likes"
                    component={LikesScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Notifications"
                    component={NotificationsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Messages"
                    component={MessageListScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="DirectMessage"
                    component={DirectMessageScreen}
                    options={{ headerShown: false }}
                  />
                </Stack.Navigator>
                <ContentPreviewModal
                  visible={previewVisible && Boolean(previewContent)}
                  item={previewContent}
                  type={previewType}
                  onClose={closePreview}
                  viewerUser={state?.user}
                  isMuted={previewMuted}
                  initialShowComments={previewShowComments}
                  onToggleSound={() => setPreviewMuted((prev) => !prev)}
                  onTogglePostLike={() => {}}
                  onToggleQuoteLike={() => {}}
                  onToggleFollow={() => {}}
                  onFlagForReview={() => {}}
                  onToggleSave={() => {}}
                  onDelete={() => {}}
                />
              </>
            </NavigationContainer>
            <Toast />
          </Context.Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ApolloProvider>
  );
}
