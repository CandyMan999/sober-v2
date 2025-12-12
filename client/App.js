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
import { getAppleId, getToken } from "./utils/helpers";

import { TabNavigator } from "./navigation";
import {
  AppleLoginScreen,
  AddUserNameScreen,
  AddPhotoScreen,
  AddSobrietyDateScreen,
  LocationPermissionScreen,
  PrivacyPolicyScreen,
  TermsEulaScreen,
} from "./screens/Onboarding";
import UserProfileScreen from "./screens/Profile/UserProfileScreen";
import FollowersScreen from "./screens/Profile/FollowersScreen";
import FollowingScreen from "./screens/Profile/FollowingScreen";
import BuddiesScreen from "./screens/Profile/BuddiesScreen";
import LikesScreen from "./screens/Profile/LikesScreen";
import NotificationsScreen from "./screens/Profile/NotificationsScreen";
import DirectMessageScreen from "./screens/DirectMessage/DirectMessageScreen";
import MessageListScreen from "./screens/DirectMessage/MessageListScreen";
import { ContentPreviewModal, PaywallModal } from "./components";
import { POST_BY_ID_QUERY, QUOTE_BY_ID_QUERY } from "./GraphQL/queries";
import { useClient } from "./client";
import { TOGGLE_LIKE_MUTATION } from "./GraphQL/mutations";
import { NotificationIntents, NotificationTypes } from "./utils/notifications";
import {
  ensureSoberMotionTrackingSetup,
  configureLocationTrackingClient,
} from "./utils/locationTracking";
import {
  addPaywallRequestListener,
  emitPaywallShown,
} from "./utils/paywallEvents";
import { RevenueCatProvider, useRevenueCat } from "./RevenueCatContext";

import Context from "./context";
import reducer from "./reducer";

const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();
const ONBOARDING_ROUTES = new Set([
  "AppleLogin",
  "AddUserName",
  "AddPhoto",
  "AddSobrietyDate",
  "LocationPermission",
  "PrivacyPolicy",
  "TermsEula",
]);
const PAYWALL_EXCLUDED_ROUTES = new Set(["ProfileHome"]);

// --- Apollo Client instance with subscriptions ---
const httpLink = new HttpLink({ uri: GRAPHQL_URI });

const authLink = setContext(async (_, { headers }) => {
  const token = await getToken();
  const appleId = await getAppleId();
  return {
    headers: {
      ...headers,
      "x-push-token": token || "",
      "x-apple-id": appleId || "",
    },
  };
});

const wsLink = new WebSocketLink({
  uri: GRAPHQL_URI.replace(/^http/, "ws"),
  options: {
    reconnect: true,
    connectionParams: async () => ({
      "x-push-token": (await getToken()) || "",
      "x-apple-id": (await getAppleId()) || "",
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

function AppContent({ state, dispatch }) {
  const graphClient = useClient();
  const currentUser = state?.user;
  const currentUserId = currentUser?.id;
  const [previewRequest, setPreviewRequest] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewType, setPreviewType] = useState("POST");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [previewShowComments, setPreviewShowComments] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallAcknowledged, setPaywallAcknowledged] = useState(false);
  const [paywallSource, setPaywallSource] = useState(null);
  const hasShownPaywallThisSession = useRef(false);
  const { isPremium, initializing: revenueCatInitializing } = useRevenueCat();
  const trialEndsAtString = currentUser?.trialEndsAt;
  const trialEndsAt = trialEndsAtString ? new Date(trialEndsAtString) : null;
  const isTrialExpired =
    typeof currentUser?.isTrialExpired === "boolean"
      ? currentUser.isTrialExpired
      : trialEndsAt
      ? trialEndsAt.getTime() <= Date.now()
      : false;
  const shouldForcePaywall = isTrialExpired && !isPremium;
  const locationTrackingAllowed =
    !!state?.user &&
    state?.user?.notificationSettings?.locationTrackingEnabled !== false;

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

    const navigateToDirectMessage = (userParam) => {
      const navigate = () =>
        navigationRef.navigate("DirectMessage", { user: userParam });

      if (navigationRef.isReady()) {
        navigate();
      } else {
        setTimeout(() => {
          if (navigationRef.isReady()) {
            navigate();
          }
        }, 300);
      }
    };

    const navigateToChatRoom = (roomName = "General") => {
      const navigate = () =>
        navigationRef.navigate("Chat", {
          screen: "ChatRooms",
          params: { screen: roomName, params: { roomName } },
        });

      if (navigationRef.isReady()) {
        navigate();
      } else {
        setTimeout(() => {
          if (navigationRef.isReady()) {
            navigate();
          }
        }, 300);
      }
    };

    const notificationTitle = data?.title || data?.__notificationTitle;
    const notificationBody =
      data?.message || data?.body || data?.__notificationBody;

    if (data?.type === "VENUE_WARNING") {
      setPreviewType("INFO");
      setPreviewContent({
        id: data?.id || `venue-warning-${Date.now()}`,
        title:
          data?.subtitle || data?.title || notificationTitle || "Venue warning",
        text:
          notificationBody ||
          "Spotted at a bar or liquor store. Take a breath and stay strong.",
        day: data?.day,
      });
      setPreviewVisible(true);
      return;
    }

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

    if (
      (data?.type === NotificationTypes.BUDDY_NEAR_BAR ||
        data?.type === NotificationTypes.BUDDY_NEAR_LIQUOR) &&
      data.buddyId
    ) {
      navigateToDirectMessage({
        id: data.buddyId,
        username: data.buddyUsername || "Buddy",
        profilePicUrl: data.buddyProfilePicUrl || null,
      });
      return;
    }

    if (data?.type === "direct_message" && data.senderId) {
      const userParam = {
        id: data.senderId,
        username: data.senderUsername || "Buddy",
        profilePicUrl: data.senderProfilePicUrl || null,
      };

      navigateToDirectMessage(userParam);
      return;
    }

    if (
      data?.intent === NotificationIntents.OPEN_CHAT_ROOM &&
      (data.roomName || data.roomId)
    ) {
      navigateToChatRoom(data.roomName || "General");
      return;
    }

    if (
      data?.type === NotificationTypes.ROOM_REPLY &&
      (data.roomName || data.roomId)
    ) {
      navigateToChatRoom(data.roomName || "General");
      return;
    }

    if (data?.type === NotificationTypes.RELAPSE_PREDICTION) {
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
    configureLocationTrackingClient({
      requestFn: graphClient.request,
      getPushTokenFn: getToken,
    });
  }, [graphClient]);

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
    if (!locationTrackingAllowed) return;

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
  }, [locationTrackingAllowed]);

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

  const handlePreviewToggleLike = useCallback(
    async (targetId, targetType = "POST") => {
      if (!targetId || !currentUserId) return;

      const token = await getToken();
      if (!token) return;

      const previousPreview = previewContent;

      setPreviewContent((prev) => {
        if (!prev || prev.id !== targetId) return prev;

        const currentlyLiked = (prev.likes || []).some(
          (like) => like?.user?.id === currentUserId
        );
        const filtered = (prev.likes || []).filter(
          (like) => like?.user?.id !== currentUserId
        );
        const optimisticLikes = currentlyLiked
          ? filtered
          : [...filtered, { id: `temp-like-${targetId}`, user: currentUser }];

        return {
          ...prev,
          likesCount: Math.max(
            0,
            (prev.likesCount || 0) + (currentlyLiked ? -1 : 1)
          ),
          likes: optimisticLikes,
        };
      });

      try {
        const data = await graphClient.request(TOGGLE_LIKE_MUTATION, {
          token,
          targetType,
          targetId,
        });

        const payload = data?.toggleLike;
        if (payload) {
          setPreviewContent((prev) => {
            if (!prev || prev.id !== targetId) return prev;

            const actorId = payload.like?.user?.id || currentUserId;
            const filtered = (prev.likes || []).filter(
              (like) => like?.user?.id !== actorId
            );
            const nextLikes =
              payload.liked && payload.like
                ? [...filtered, payload.like]
                : filtered;

            return {
              ...prev,
              likesCount: payload.likesCount,
              likes: nextLikes,
            };
          });
        }
      } catch (err) {
        console.error("Failed to toggle preview like", err);
        setPreviewContent(previousPreview);
      }
    },
    [currentUser, currentUserId, graphClient, previewContent]
  );

  const maybeShowPaywall = useCallback(() => {
    if (hasShownPaywallThisSession.current) return;
    if (paywallAcknowledged) return;
    if (revenueCatInitializing) return;
    if (!shouldForcePaywall) return;

    if (!navigationRef.isReady()) return;

    const currentRoute = navigationRef.getCurrentRoute();
    const routeName = currentRoute?.name;

    if (
      !routeName ||
      ONBOARDING_ROUTES.has(routeName) ||
      PAYWALL_EXCLUDED_ROUTES.has(routeName)
    ) {
      return;
    }

    hasShownPaywallThisSession.current = true;
    setPaywallSource("auto");
    setPaywallVisible(true);
  }, [paywallAcknowledged, revenueCatInitializing, shouldForcePaywall]);

  useEffect(() => {
    if (shouldForcePaywall) {
      setPaywallAcknowledged(false);
    }
  }, [shouldForcePaywall]);

  useEffect(() => {
    if (!navigationReady) return;
    maybeShowPaywall();
  }, [maybeShowPaywall, navigationReady]);

  useEffect(() => {
    maybeShowPaywall();
  }, [currentUser?.id, maybeShowPaywall, revenueCatInitializing]);

  useEffect(() => {
    if (isPremium) {
      setPaywallVisible(true);
      setPaywallAcknowledged(true);
      setPaywallSource(null);
    }
  }, [isPremium]);

  useEffect(() => {
    if (!currentUser) {
      setPaywallAcknowledged(false);
      setPaywallVisible(false);
      setPaywallSource(null);
      hasShownPaywallThisSession.current = false;
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (paywallVisible) {
      setPreviewMuted(true);
      emitPaywallShown();
    }
  }, [paywallVisible]);

  useEffect(() => {
    const removeListener = addPaywallRequestListener(() => {
      setPaywallSource("manual");
      setPaywallVisible(true);
    });

    return removeListener;
  }, []);

  const handleDismissPaywall = useCallback(() => {
    if (paywallSource !== "manual" || shouldForcePaywall) {
      setPaywallAcknowledged(true);
    }
    setPaywallVisible(false);
    setPaywallSource(null);
  }, [paywallSource, shouldForcePaywall]);

  const handleSelectPremium = useCallback(() => {
    setPaywallAcknowledged(true);
    setPaywallVisible(false);
    setPaywallSource(null);
  }, []);

  const handleSelectFree = useCallback(() => {
    setPaywallAcknowledged(true);
    setPaywallVisible(false);
    setPaywallSource(null);
  }, []);

  const handleOpenTerms = useCallback(() => {
    handleDismissPaywall();
    if (navigationRef.isReady()) {
      navigationRef.navigate("TermsEula");
    }
  }, [handleDismissPaywall]);

  const handleOpenPrivacy = useCallback(() => {
    handleDismissPaywall();
    if (navigationRef.isReady()) {
      navigationRef.navigate("PrivacyPolicy");
    }
  }, [handleDismissPaywall]);

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          setNavigationReady(true);
          maybeShowPaywall();
        }}
        onStateChange={maybeShowPaywall}
      >
        <>
          <Stack.Navigator
            screenOptions={{
              headerShown: true,
            }}
          >
            <Stack.Screen
              name="AppleLogin"
              component={AppleLoginScreen}
              options={{ headerShown: false }}
            />
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
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{ title: "Privacy Policy" }}
            />
            <Stack.Screen
              name="TermsEula"
              component={TermsEulaScreen}
              options={{ title: "Terms & EULA" }}
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
            onTogglePostLike={(postId) =>
              handlePreviewToggleLike(postId, "POST")
            }
            onToggleQuoteLike={(quoteId) =>
              handlePreviewToggleLike(quoteId, "QUOTE")
            }
            onToggleFollow={() => {}}
            onFlagForReview={() => {}}
            onToggleSave={() => {}}
            onDelete={() => {}}
          />
          <PaywallModal
            visible={paywallVisible}
            onClose={handleDismissPaywall}
            onSelectPremium={handleSelectPremium}
            onSelectFree={handleSelectFree}
            onOpenTerms={handleOpenTerms}
            onOpenPrivacy={handleOpenPrivacy}
          />
        </>
      </NavigationContainer>
      <Toast />
    </>
  );
}

export default function App() {
  const initialState = useContext(Context);
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ApolloProvider client={client}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Context.Provider value={{ state, dispatch }}>
            <RevenueCatProvider state={state} dispatch={dispatch}>
              <AppContent state={state} dispatch={dispatch} />
            </RevenueCatProvider>
          </Context.Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ApolloProvider>
  );
}
