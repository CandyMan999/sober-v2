// screens/Profile/EditProfileScreen.js
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import {
  Feather,
  MaterialCommunityIcons,
  AntDesign,
  FontAwesome6,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { EXPO_CF_ACCOUNT_HASH, EXPO_CF_VARIANT } from "@env";

import { AlertModal } from "../../components";
import Context from "../../context";
import { useClient } from "../../client";
import {
  DIRECT_UPLOAD_MUTATION,
  ADD_PICTURE_MUTATION,
  DELETE_PHOTO_MUTATION,
  UPDATE_USER_PROFILE_MUTATION,
  UPDATE_SOCIAL_MUTATION,
  UPDATE_NOTIFICATION_SETTINGS_MUTATION,
  TOGGLE_NOTIFICATION_CATEGORY_MUTATION,
  DELETE_ACCOUNT_MUTATION,
} from "../../GraphQL/mutations";
import { FETCH_ME_QUERY, MY_POPULARITY_QUERY } from "../../GraphQL/queries";
import { getToken } from "../../utils/helpers";
import { COLORS } from "../../constants/colors";
import {
  configureLocationTrackingClient,
  initSoberMotionTracking,
  stopAllSoberLocationTracking,
} from "../../utils/locationTracking";
import { useRevenueCat } from "../../RevenueCatContext";
import { emitPaywallRequest } from "../../utils/paywallEvents";
import { defaultPopularityWeighting } from "../../utils/popularity";
import {
  DeleteProfileButton,
  NotificationSettingsSection,
  PhotoTilesSection,
  PopularitySection,
  PrivacySection,
  SocialLinksSection,
  UsernameSection,
} from "./components/EditProfile";

const {
  primaryBackground,
  cardBackground,
  accent,
  textPrimary,
  textSecondary,
  border,
  oceanBlue,
  nightBlue,
} = COLORS;

const GEOFENCE_TASK_NAME = "SM_GEOFENCE_TASK";

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 13;

const SOCIAL_ICON_SIZE = 22;
const SOCIAL_ICON_COLOR = textPrimary;

const SOCIAL_CONFIG = {
  instagram: {
    label: "Instagram (Optional)",
    placeholder: "@username",
    errorLabel: "Instagram",
    regex: /^[A-Za-z0-9._]{1,30}$/,
    urlPrefixes: [
      /^https?:\/\/(www\.)?instagram\.com\//i,
      /^instagram:\/\/user\?username=/i,
    ],
    icon: (
      <Feather
        name="instagram"
        size={SOCIAL_ICON_SIZE}
        color={SOCIAL_ICON_COLOR}
      />
    ),
  },
  tiktok: {
    label: "TikTok (Optional)",
    placeholder: "@username",
    errorLabel: "TikTok",
    regex: /^[A-Za-z0-9._]{1,24}$/,
    urlPrefixes: [
      /^https?:\/\/(www\.)?tiktok\.com\/[@]?/i,
      /^tiktok:\/\/user\?username=/i,
    ],
    icon: (
      <FontAwesome6
        name="tiktok"
        size={SOCIAL_ICON_SIZE}
        color={SOCIAL_ICON_COLOR}
      />
    ),
  },
  x: {
    label: "X (Optional)",
    placeholder: "@handle",
    errorLabel: "X",
    regex: /^[A-Za-z0-9_]{1,15}$/,
    urlPrefixes: [
      /^https?:\/\/(www\.)?(x|twitter)\.com\//i,
      /^twitter:\/\//i,
      /^x:\/\/profile\//i,
    ],
    icon: (
      <AntDesign name="x" size={SOCIAL_ICON_SIZE} color={SOCIAL_ICON_COLOR} />
    ),
  },
};

const POPULARITY_METRICS = [
  {
    key: "watchMinutes",
    label: "Watch time",
    unit: "min",
    format: (value) => `${Math.round(value || 0)} min`,
  },
  { key: "posts", label: "Posts", unit: "posts" },
  { key: "comments", label: "Comments", unit: "comments" },
  { key: "likes", label: "Likes", unit: "likes" },
  { key: "followers", label: "Followers", unit: "followers" },
  { key: "approvedQuotes", label: "Approved quotes", unit: "quotes" },
];

const normalizeSocialInput = (platform, rawValue) => {
  const value =
    typeof rawValue === "string"
      ? rawValue
      : typeof rawValue === "object" && rawValue !== null
      ? rawValue.handle
      : "";

  let handle = (value || "").trim();
  if (!handle) return "";

  handle = handle.replace(/@/g, "");

  SOCIAL_CONFIG[platform]?.urlPrefixes?.forEach((pattern) => {
    handle = handle.replace(pattern, "");
  });

  handle = handle.split(/[/?#]/)[0];
  return handle;
};

const EditProfileScreen = ({ navigation }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);

  const { currentOffering, isPremium, customerInfo } = useRevenueCat();

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(state?.user || null);
  const [popularity, setPopularity] = useState(null);
  const [loadingPopularity, setLoadingPopularity] = useState(false);
  const [popularityOpen, setPopularityOpen] = useState(false);
  const [loading, setLoading] = useState(!state?.user);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [profileUri, setProfileUri] = useState(user?.profilePicUrl || null);
  const [drunkUri, setDrunkUri] = useState(user?.drunkPicUrl || null);
  const [profileId, setProfileId] = useState(user?.profilePic?.id || null);
  const [drunkId, setDrunkId] = useState(user?.drunkPic?.id || null);

  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [deletingSlot, setDeletingSlot] = useState(null);

  const [usernameOpen, setUsernameOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);

  const [socialInputs, setSocialInputs] = useState({
    instagram: normalizeSocialInput("instagram", user?.social?.instagram),
    tiktok: normalizeSocialInput("tiktok", user?.social?.tiktok),
    x: normalizeSocialInput("x", user?.social?.x),
  });
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);

  const defaultNotificationSettings = {
    allPushEnabled: false,
    otherUserMilestones: true,
    otherUserComments: true,
    followingPosts: true,
    buddiesNearVenue: true,
    dailyPush: true,
    locationTrackingEnabled: true,
  };

  const [notificationSettings, setNotificationSettings] = useState(
    defaultNotificationSettings
  );
  const [locationEnabled, setLocationEnabled] = useState(
    defaultNotificationSettings.locationTrackingEnabled
  );
  const [locationToggleLoading, setLocationToggleLoading] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [savingNotificationKey, setSavingNotificationKey] = useState(null);

  const [alertState, setAlertState] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
    onCancel: null,
  });

  const closeAlert = () =>
    setAlertState({
      visible: false,
      title: "",
      message: "",
      type: "info",
      onConfirm: null,
      onCancel: null,
    });

  // RevenueCat debug logging
  useEffect(() => {
    console.log("[SoberMotion] Subscription debug:", {
      isPremium,
      hasOffering: !!currentOffering,
      entitlements: customerInfo?.entitlements,
    });
  }, [isPremium, currentOffering, customerInfo]);

  const hasAlwaysLocationPermission = async () => {
    const fg = await Location.getForegroundPermissionsAsync();
    const bg = await Location.getBackgroundPermissionsAsync();

    return (
      bg.status === "granted" ||
      (fg.status === "granted" && fg.scope === "always")
    );
  };

  const syncLocationPermissionState = async () => {
    try {
      const hasPermission = await hasAlwaysLocationPermission();
      const isTracking =
        hasPermission &&
        (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME));

      setLocationEnabled(isTracking);

      if (isTracking) {
        configureLocationTrackingClient({
          requestFn: client.request,
          getPushTokenFn: getToken,
        });
      }
    } catch (err) {
      console.log("Unable to sync location permission", err);
    }
  };

  const fetchPopularitySnapshot = async (authToken) => {
    if (!authToken) return;

    try {
      setLoadingPopularity(true);
      const data = await client.request(MY_POPULARITY_QUERY, {
        token: authToken,
      });

      setPopularity(data?.myPopularity || null);
    } catch (err) {
      console.log("Failed to load popularity", err);
    } finally {
      setLoadingPopularity(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const storedToken = await getToken();
        if (!storedToken) {
          setLoading(false);
          return;
        }
        setToken(storedToken);

        const data = await client.request(FETCH_ME_QUERY, {
          token: storedToken,
        });
        const fetchedUser = data?.fetchMe;
        if (fetchedUser) {
          setUser(fetchedUser);
          setProfileUri(fetchedUser.profilePicUrl || null);
          setDrunkUri(fetchedUser.drunkPicUrl || null);
          setProfileId(fetchedUser.profilePic?.id || null);
          setDrunkId(fetchedUser.drunkPic?.id || null);
          setUsernameInput(fetchedUser.username || "");
          setSocialInputs({
            instagram: normalizeSocialInput(
              "instagram",
              fetchedUser.social?.instagram
            ),
            tiktok: normalizeSocialInput("tiktok", fetchedUser.social?.tiktok),
            x: normalizeSocialInput("x", fetchedUser.social?.x),
          });
          const normalizedSettings = {
            ...defaultNotificationSettings,
            ...(fetchedUser.notificationSettings || {}),
          };

          setNotificationSettings(normalizedSettings);
          if (typeof normalizedSettings.locationTrackingEnabled === "boolean") {
            setLocationEnabled(normalizedSettings.locationTrackingEnabled);
          }
          dispatch({ type: "SET_USER", payload: fetchedUser });
          fetchPopularitySnapshot(storedToken);
        }
      } catch (err) {
        console.log("Failed to fetch profile", err);
        showError(
          "We couldn't load your profile right now. Please try again.",
          "Profile error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileUri(user.profilePicUrl || null);
    setDrunkUri(user.drunkPicUrl || null);
    setProfileId(user.profilePic?.id || null);
    setDrunkId(user.drunkPic?.id || null);
    setUsernameInput(user.username || "");
    setSocialInputs({
      instagram: normalizeSocialInput("instagram", user.social?.instagram),
      tiktok: normalizeSocialInput("tiktok", user.social?.tiktok),
      x: normalizeSocialInput("x", user.social?.x),
    });
  }, [user]);

  useEffect(() => {
    syncLocationPermissionState();
  }, []);

  const showError = (message, title = "Heads up") => {
    setAlertState({
      visible: true,
      title,
      message,
      type: "error",
      onConfirm: closeAlert,
      onCancel: closeAlert,
    });
  };

  const openManageSubscriptions = async () => {
    console.log("[SoberMotion] Manage subscription pressed", {
      isPremium,
    });

    const subscriptionUrl = Platform.select({
      ios: "https://apps.apple.com/account/subscriptions",
      android: "https://play.google.com/store/account/subscriptions",
      default: "https://apps.apple.com/account/subscriptions",
    });

    try {
      await Linking.openURL(subscriptionUrl);
    } catch (err) {
      console.log("Unable to open subscription settings", err);
      showError(
        "We couldn't open your subscription settings. Please try again.",
        "Subscription"
      );
    }
  };

  const openUpgradePaywall = () => {
    console.log("[SoberMotion] Upgrade to Premium pressed", {
      isPremium,
    });
    emitPaywallRequest();
  };

  const notificationCategoryMap = useMemo(
    () => ({
      otherUserMilestones: "OTHER_USER_MILESTONES",
      otherUserComments: "OTHER_USER_COMMENTS",
      followingPosts: "FOLLOWING_POSTS",
      buddiesNearVenue: "BUDDIES_NEAR_VENUE",
      dailyPush: "DAILY_PUSH",
    }),
    []
  );

  const persistLocationTrackingSetting = async (enabled) => {
    if (!token) {
      showError(
        "We need your device ID to update your location setting. Please restart the app.",
        "Unable to update"
      );
      return false;
    }

    try {
      const response = await client.request(
        UPDATE_NOTIFICATION_SETTINGS_MUTATION,
        {
          token,
          input: { locationTrackingEnabled: enabled },
        }
      );

      const updated =
        response?.updateNotificationSettings?.notificationSettings || null;

      if (updated) {
        setNotificationSettings((prev) => ({ ...prev, ...updated }));
        dispatch({
          type: "SET_USER",
          payload: {
            ...(response?.updateNotificationSettings || {}),
            notificationSettings: updated,
          },
        });
      }

      return true;
    } catch (err) {
      console.log("Failed to persist location tracking preference", err);
      showError(
        "We couldn't save your location tracking preference. Please try again.",
        "Location tracking"
      );
      return false;
    }
  };

  const handleNotificationSettingChange = async (key, value) => {
    if (!token) {
      showError(
        "We need your device ID to update notifications. Please restart the app.",
        "Unable to update"
      );
      return;
    }

    const previousValue = notificationSettings[key];
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));
    setSavingNotificationKey(key);

    try {
      if (key === "allPushEnabled") {
        const response = await client.request(
          UPDATE_NOTIFICATION_SETTINGS_MUTATION,
          {
            token,
            input: { allPushEnabled: value },
          }
        );

        const updated =
          response?.updateNotificationSettings?.notificationSettings || null;

        if (updated) {
          setNotificationSettings((prev) => ({ ...prev, ...updated }));
          dispatch({
            type: "SET_USER",
            payload: {
              ...(response?.updateNotificationSettings || {}),
              notificationSettings: updated,
            },
          });
        }
      } else {
        const category = notificationCategoryMap[key];

        const response = await client.request(
          TOGGLE_NOTIFICATION_CATEGORY_MUTATION,
          {
            token,
            category,
            enabled: value,
          }
        );

        const updated = response?.toggleNotificationCategory;
        if (updated) {
          setNotificationSettings((prev) => ({ ...prev, ...updated }));
          dispatch({
            type: "SET_USER",
            payload: {
              ...(state?.user || {}),
              notificationSettings: updated,
            },
          });
        }
      }
    } catch (err) {
      console.log("Failed to update notification preference", err);
      setNotificationSettings((prev) => ({ ...prev, [key]: previousValue }));
      showError(
        "We couldn't update your notification preference. Please try again.",
        "Notification update failed"
      );
    } finally {
      setSavingNotificationKey(null);
    }
  };

  const handleDisableLocationTracking = async () => {
    setLocationToggleLoading(true);

    try {
      await stopAllSoberLocationTracking();
      setLocationEnabled(false);
      await persistLocationTrackingSetting(false);
    } catch (err) {
      console.log("Unable to disable location tracking", err);
      showError(
        "We couldn't turn off location tracking right now. Please try again.",
        "Location tracking"
      );
    } finally {
      setLocationToggleLoading(false);
      closeAlert();
    }
  };

  const confirmDisableLocationTracking = () => {
    setAlertState({
      visible: true,
      type: "confirm",
      title: "Turn off sober motion?",
      message:
        "You're about to turn off the coolest feature that keeps you sober. We use smart geo-fencing to alert you and your buddies when you're near bars or liquor stores — turning this off won't save battery.",
      confirmLabel: "Turn off",
      cancelLabel: "Keep on",
      onConfirm: handleDisableLocationTracking,
      onCancel: () => {
        setLocationEnabled(true);
        closeAlert();
      },
    });
  };

  const handleEnableLocationTracking = async () => {
    setLocationToggleLoading(true);

    try {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status !== "granted") {
        setLocationEnabled(false);
        showError(
          "We need location access to keep you and your buddies aware.",
          "Permission needed"
        );
        return;
      }

      const bg = await Location.requestBackgroundPermissionsAsync();
      const hasAlways =
        bg.status === "granted" || (await hasAlwaysLocationPermission());

      if (!hasAlways) {
        setLocationEnabled(false);
        showError(
          'Please choose "Always Allow" so we can alert you and your buddies when you are near bars or liquor stores.',
          "Always allow background"
        );
        return;
      }

      configureLocationTrackingClient({
        requestFn: client.request,
        getPushTokenFn: getToken,
      });

      await initSoberMotionTracking();
      setLocationEnabled(true);
      await persistLocationTrackingSetting(true);
    } catch (err) {
      console.log("Unable to enable location tracking", err);
      setLocationEnabled(false);
      showError(
        "We couldn't update your location tracking right now. Please try again.",
        "Location tracking"
      );
    } finally {
      setLocationToggleLoading(false);
    }
  };

  const handleLocationToggle = async (value) => {
    if (locationToggleLoading) return;

    if (!value) {
      return confirmDisableLocationTracking();
    }

    await handleEnableLocationTracking();
  };

  const requestMediaPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showError("We need access to your library to update your photos.");
      return false;
    }
    return true;
  };

  const confirmDeleteProfile = async () => {
    if (!token) {
      showError(
        "We need your device ID to delete your profile. Please restart the app.",
        "Unable to delete"
      );
      return;
    }

    try {
      setDeletingAccount(true);
      await client.request(DELETE_ACCOUNT_MUTATION, { token });

      await AsyncStorage.removeItem("expoPushToken");
      dispatch({ type: "SET_USER", payload: null });
      setUser(null);

      navigation.reset({
        index: 0,
        routes: [{ name: "AddUserName" }],
      });
    } catch (err) {
      console.log("Delete profile error", err);
      showError("We couldn't delete your profile right now. Please try again.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteProfile = () => {
    setAlertState({
      visible: true,
      type: "confirm",
      title: "Delete profile",
      message:
        "This will remove your posts, photos, comments, likes, followers, and buddies. This can't be undone.",
      onCancel: closeAlert,
      onConfirm: () => {
        closeAlert();
        confirmDeleteProfile();
      },
    });
  };

  const uploadToCloudflare = async (localUri, slot) => {
    try {
      const { directUpload } = await client.request(DIRECT_UPLOAD_MUTATION);
      if (!directUpload?.uploadURL) throw new Error("Upload URL missing");

      const formData = new FormData();
      formData.append("file", {
        uri: localUri,
        type: "image/jpeg",
        name: "upload.jpg",
      });

      const uploadRes = await fetch(directUpload.uploadURL, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image");

      const deliveryUrl = `https://imagedelivery.net/o9IMJdMAwk7ijgmm9FnmYg/${directUpload.id}/public`;

      const { addPicture } = await client.request(ADD_PICTURE_MUTATION, {
        token,
        url: deliveryUrl,
        publicId: directUpload.id,
        slot,
      });

      return { url: deliveryUrl, id: addPicture?.id };
    } catch (err) {
      console.log("Upload error", err);
      showError("We couldn't upload that photo. Please try again.");
      return null;
    }
  };

  const pickImage = async (slot) => {
    const isProfile = slot === "PROFILE";
    if (!token) {
      showError(
        "We need your device ID to update photos. Please restart the app."
      );
      return;
    }

    if (uploadingSlot || !(await requestMediaPermission())) return;

    setUploadingSlot(slot);

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: isProfile,
      aspect: isProfile ? [3, 4] : undefined,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (pickerResult.canceled) {
      setUploadingSlot(null);
      return;
    }

    const resized = await ImageManipulator.manipulateAsync(
      pickerResult.assets[0].uri,
      [{ resize: { width: 900 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
    );

    if (isProfile) setProfileUri(resized.uri);
    else setDrunkUri(resized.uri);

    const uploaded = await uploadToCloudflare(resized.uri, slot);
    if (uploaded) {
      if (isProfile) {
        setProfileUri(uploaded.url);
        setProfileId(uploaded.id);
      } else {
        setDrunkUri(uploaded.url);
        setDrunkId(uploaded.id);
      }
    }

    setUploadingSlot(null);
  };

  const deletePhoto = async (slot) => {
    const isProfile = slot === "PROFILE";
    const photoId = isProfile ? profileId : drunkId;
    if (!photoId || deletingSlot) return;
    if (!token) {
      showError(
        "We need your device ID to delete photos. Please restart the app."
      );
      return;
    }

    setDeletingSlot(slot);
    try {
      const { deletePhoto } = await client.request(DELETE_PHOTO_MUTATION, {
        token,
        photoId,
        slot,
      });

      setUser(deletePhoto);
      dispatch({ type: "SET_USER", payload: deletePhoto });
      if (isProfile) {
        setProfileUri(null);
        setProfileId(null);
      } else {
        setDrunkUri(null);
        setDrunkId(null);
      }
    } catch (err) {
      console.log("Delete error", err);
      showError("We couldn't delete that photo. Please try again.");
    }

    setDeletingSlot(null);
  };

  const usernameDisplay = useMemo(
    () => usernameInput?.trim() || "Add a handle",
    [usernameInput]
  );

  const trimmedUsername = useMemo(() => usernameInput.trim(), [usernameInput]);
  const isUsernameValid =
    trimmedUsername.length >= MIN_USERNAME_LENGTH &&
    trimmedUsername.length <= MAX_USERNAME_LENGTH;
  const usernameValidationText = useMemo(() => {
    if (usernameInput.length === 0) return "You can change this later.";
    if (trimmedUsername.length < MIN_USERNAME_LENGTH)
      return "At least 3 characters.";
    if (trimmedUsername.length > MAX_USERNAME_LENGTH)
      return "Max 13 characters.";
    return "Looks good.";
  }, [trimmedUsername.length, usernameInput]);

  const socialValidation = useMemo(() => {
    const errors = {};

    Object.entries(socialInputs).forEach(([platform, value]) => {
      const cleaned = normalizeSocialInput(platform, value);
      const config = SOCIAL_CONFIG[platform];
      const label = config?.errorLabel || config?.label || platform;

      if (cleaned && config?.regex && !config.regex.test(cleaned)) {
        errors[platform] = `Enter a valid ${label} username.`;
      }
    });

    return errors;
  }, [socialInputs]);

  const isSocialValid = useMemo(
    () => Object.keys(socialValidation).length === 0,
    [socialValidation]
  );

  const popularityBreakdown = useMemo(
    () => popularity?.breakdown || {},
    [popularity?.breakdown]
  );

  const popularityStatus = popularity?.status || "Getting Started";
  const popularityScore = Math.round(popularity?.score || 0);

  const popularityEntries = useMemo(
    () =>
      POPULARITY_METRICS.map((metric) => {
        const value = Number(popularityBreakdown[metric.key]) || 0;
        const milestone =
          defaultPopularityWeighting?.[metric.key]?.milestone || 0;
        const progress = milestone ? Math.min(value / milestone, 1) : 0;
        const milestoneLabel = milestone
          ? `Goal: ${milestone} ${metric.unit || metric.label.toLowerCase()}`
          : "Keep going";

        return {
          ...metric,
          value,
          milestone,
          progress,
          displayValue: metric.format ? metric.format(value) : value,
          milestoneLabel,
        };
      }),
    [popularityBreakdown]
  );

  const handleSaveUsername = async () => {
    if (!token || savingUsername || !isUsernameValid) return;
    const trimmed = trimmedUsername;
    if (!trimmed) {
      showError("Please enter a username to continue.");
      return;
    }

    try {
      setSavingUsername(true);
      const { updateUserProfile } = await client.request(
        UPDATE_USER_PROFILE_MUTATION,
        { token, username: trimmed }
      );

      setUser(updateUserProfile);
      dispatch({
        type: "SET_USER",
        payload: { ...user, ...updateUserProfile },
      });
      setUsernameOpen(false);
    } catch (err) {
      const message =
        err?.response?.errors?.[0]?.message ||
        "We couldn't update your username right now.";
      showError(message, "Username error");
    } finally {
      setSavingUsername(false);
      setUsernameOpen(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    if (!token || savingSocial || !isSocialValid) return;

    const payload = Object.fromEntries(
      Object.entries(socialInputs).map(([platform, value]) => [
        platform,
        normalizeSocialInput(platform, value) || null,
      ])
    );

    const currentHandles = {
      instagram: normalizeSocialInput("instagram", user?.social?.instagram),
      tiktok: normalizeSocialInput("tiktok", user?.social?.tiktok),
      x: normalizeSocialInput("x", user?.social?.x),
    };

    const updates = Object.entries(payload).filter(
      ([platform, handle]) => handle !== currentHandles[platform]
    );

    if (!updates.length) return;

    try {
      setSavingSocial(true);
      let latestUser = user;

      for (const [platform, handle] of updates) {
        const { updateSocial } = await client.request(UPDATE_SOCIAL_MUTATION, {
          token,
          platform,
          handle,
        });

        latestUser = updateSocial;
      }

      if (latestUser) {
        setUser(latestUser);
        dispatch({ type: "SET_USER", payload: { ...user, ...latestUser } });
        dispatch({
          type: "SET_PROFILE_OVERVIEW",
          payload: { ...(state?.profileOverview || {}), user: latestUser },
        });
        setSocialInputs({
          instagram: normalizeSocialInput(
            "instagram",
            latestUser.social?.instagram
          ),
          tiktok: normalizeSocialInput("tiktok", latestUser.social?.tiktok),
          x: normalizeSocialInput("x", latestUser.social?.x),
        });
      }
    } catch (err) {
      const message =
        err?.response?.errors?.[0]?.message ||
        "We couldn't update your social links right now.";
      showError(message, "Social links");
    } finally {
      setSavingSocial(false);
      setSocialOpen(false);
    }
  };

  const isBusy = loading || deletingAccount;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={12}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
            accessibilityLabel="Go back"
            activeOpacity={0.85}
          >
            <Feather name="chevron-left" size={20} color="#f59e0b" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Edit profile</Text>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <PhotoTilesSection
            currentUser={user}
            onUserUpdated={setUser}
            showError={showError}
          />

          <UsernameSection
            currentUser={user}
            onUserUpdated={setUser}
            showError={showError}
          />

          <SocialLinksSection
            currentUser={user}
            onUserUpdated={setUser}
            showError={showError}
          />

          <NotificationSettingsSection
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            notificationSettings={notificationSettings}
            handleNotificationSettingChange={handleNotificationSettingChange}
            savingNotificationKey={savingNotificationKey}
          />

          <PopularitySection
            popularityOpen={popularityOpen}
            setPopularityOpen={setPopularityOpen}
            popularityStatus={popularityStatus}
            popularityScore={popularityScore}
            popularityEntries={popularityEntries}
            loadingPopularity={loadingPopularity}
          />

          {/* SUBSCRIPTION & BILLING */}
          <View style={styles.sectionCard}>
            <View style={styles.planHeaderRow}>
              <Text style={styles.sectionLabel}>Subscription</Text>

              <View
                style={[
                  styles.planBadge,
                  isPremium ? styles.planBadgePremium : styles.planBadgeFree,
                ]}
              >
                <MaterialCommunityIcons
                  name={isPremium ? "crown-outline" : "shield-alert"}
                  size={14}
                  color={isPremium ? "#fef3c7" : "#e5e7eb"}
                />
                <Text style={styles.planBadgeText}>
                  {isPremium ? "Premium" : "Free plan"}
                </Text>
              </View>
            </View>

            <Text style={styles.planHelperText}>
              {isPremium
                ? "You’re supporting your sobriety and helping keep Sober Motivation ad-light."
                : "Stay ad-light and keep chatting with Owl after your trial by upgrading to Premium."}
            </Text>

            {!isPremium && (
              <TouchableOpacity
                style={styles.upgradeButton}
                activeOpacity={0.9}
                onPress={openUpgradePaywall}
              >
                <LinearGradient
                  colors={["rgba(56,189,248,0.22)", "rgba(129,140,248,0.18)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.upgradeInner}
                >
                  <View style={styles.upgradeContent}>
                    <View style={styles.upgradeIconBadge}>
                      <MaterialCommunityIcons
                        name="crown-outline"
                        size={18}
                        color={accent}
                      />
                    </View>

                    <View style={styles.upgradeTextBlock}>
                      <Text style={styles.upgradeTitle}>
                        Upgrade to Premium
                      </Text>
                      <Text style={styles.upgradeSubtitle}>
                        Keep Owl coaching, unlock future tools, and stay
                        ad-light.
                      </Text>
                    </View>

                    <View style={styles.upgradePill}>
                      <Text style={styles.upgradePillText}>View plans</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isPremium && (
              <TouchableOpacity
                style={styles.manageSubButton}
                activeOpacity={0.9}
                onPress={openManageSubscriptions}
              >
                <LinearGradient
                  colors={["rgba(16,185,129,0.9)", "rgba(59,130,246,0.85)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.manageSubInner}
                >
                  <View style={styles.manageSubContent}>
                    <View style={styles.manageSubIconBadge}>
                      <MaterialCommunityIcons
                        name="account-cog-outline"
                        size={18}
                        color="#ecfeff"
                      />
                    </View>
                    <View style={styles.manageSubTextBlock}>
                      <Text style={styles.manageSubTitle}>
                        Manage subscription
                      </Text>
                      <Text style={styles.manageSubSubtitle}>
                        Change or cancel any time via your app store.
                      </Text>
                    </View>
                    <View style={styles.manageSubChevron}>
                      <Feather
                        name="arrow-up-right"
                        size={16}
                        color="#ecfeff"
                      />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <PrivacySection
            notificationSettings={notificationSettings}
            handleNotificationSettingChange={handleNotificationSettingChange}
            savingNotificationKey={savingNotificationKey}
            locationEnabled={locationEnabled}
            handleLocationToggle={handleLocationToggle}
            locationToggleLoading={locationToggleLoading}
          />

          <DeleteProfileButton
            deletingAccount={deletingAccount}
            onPress={handleDeleteProfile}
          />

          <View style={styles.legalFooter}>
            <Text style={styles.legalFooterText}>
              <Text
                style={styles.legalFooterLink}
                onPress={() => navigation.navigate("TermsEula")}
              >
                Terms of Service
              </Text>{" "}
              ·{" "}
              <Text
                style={styles.legalFooterLink}
                onPress={() => navigation.navigate("PrivacyPolicy")}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>

        {isBusy ? (
          <View style={styles.loadingScreen}>
            <ActivityIndicator color={accent} size="large" />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <AlertModal
        visible={alertState.visible}
        type={alertState.type || "info"}
        title={alertState.title}
        message={alertState.message}
        onConfirm={alertState.onConfirm || closeAlert}
        onCancel={alertState.onCancel || closeAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: primaryBackground,
  },
  container: {
    flex: 1,
    backgroundColor: primaryBackground,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 12,
  },
  backButton: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  screenTitle: {
    color: textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  sectionCard: {
    backgroundColor: cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: border,
    padding: 14,
    marginTop: 16,
  },
  sectionLabel: {
    color: textSecondary,
    fontSize: 12,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  planHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  planBadgePremium: {
    backgroundColor: "rgba(251,191,36,0.1)",
    borderColor: "rgba(251,191,36,0.8)",
  },
  planBadgeFree: {
    backgroundColor: "rgba(31,41,55,0.7)",
    borderColor: "rgba(75,85,99,0.9)",
  },
  planBadgeText: {
    color: "#e5e7eb",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  planHelperText: {
    color: textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 10,
  },
  upgradeButton: {
    marginTop: 14,
    borderRadius: 14,
    overflow: "hidden",
  },
  upgradeInner: {
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
    backgroundColor: "rgba(15,23,42,0.96)",
  },
  upgradeContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  upgradeIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.9)",
  },
  upgradeTextBlock: {
    flex: 1,
  },
  upgradeTitle: {
    color: textPrimary,
    fontWeight: "800",
    fontSize: 14,
  },
  upgradeSubtitle: {
    color: textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  upgradePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(251,191,36,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.65)",
  },
  upgradePillText: {
    color: accent,
    fontSize: 11,
    fontWeight: "700",
  },
  manageSubButton: {
    marginTop: 14,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
  },
  manageSubInner: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  manageSubContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  manageSubIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(22,163,74,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.9)",
  },
  manageSubTextBlock: {
    flex: 1,
  },
  manageSubTitle: {
    color: "#ecfeff",
    fontWeight: "800",
    fontSize: 14,
  },
  manageSubSubtitle: {
    color: "#d1fae5",
    fontSize: 12,
    marginTop: 2,
  },
  manageSubChevron: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: "rgba(22,163,74,0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.9)",
  },
  legalFooter: {
    marginTop: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  legalFooterText: {
    color: textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  legalFooterLink: {
    color: textPrimary,
    textDecorationLine: "underline",
    fontWeight: "700",
  },
  loadingScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,22,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EditProfileScreen;
