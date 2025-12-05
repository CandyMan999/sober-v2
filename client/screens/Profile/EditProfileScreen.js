import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  AntDesign,
  FontAwesome6,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { EXPO_CF_ACCOUNT_HASH, EXPO_CF_VARIANT } from "@env";

import { AlertModal, ToggleSwitch } from "../../components";
import Context from "../../context";
import { useClient } from "../../client";
import {
  DIRECT_UPLOAD_MUTATION,
  ADD_PICTURE_MUTATION,
  DELETE_PHOTO_MUTATION,
  UPDATE_USER_PROFILE_MUTATION,
  UPDATE_SOCIAL_MUTATION,
  DELETE_ACCOUNT_MUTATION,
} from "../../GraphQL/mutations";
import { FETCH_ME_QUERY } from "../../GraphQL/queries";
import { getToken } from "../../utils/helpers";
import { COLORS } from "../../constants/colors";

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

const PhotoTileBase = ({ children, label, onPress, style }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.photoTile, style]}
  >
    {children}
    <Text style={styles.photoLabel}>{label}</Text>
  </TouchableOpacity>
);

const ProfilePhotoTile = ({
  label,
  uri,
  isUploading,
  isDeleting,
  onPick,
  onDelete,
}) => (
  <PhotoTileBase label={label} onPress={onPick}>
    <LinearGradient colors={[accent, accent]} style={styles.profileHalo}>
      <View style={styles.profilePreview}>
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.profileImage, styles.photoPlaceholder]}>
            <Feather name="camera" color={textSecondary} size={24} />
            <Text style={styles.placeholderText}>Tap to upload</Text>
          </View>
        )}

        {isUploading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={primaryBackground} />
          </View>
        ) : null}

        {uri && !isUploading ? (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            disabled={isDeleting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="trash-2" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </LinearGradient>
  </PhotoTileBase>
);

const DrunkPhotoTile = ({
  label,
  uri,
  isUploading,
  isDeleting,
  onPick,
  onDelete,
}) => (
  <PhotoTileBase label={label} onPress={onPick} style={styles.drunkTile}>
    <LinearGradient colors={[oceanBlue, oceanBlue]} style={styles.drunkHalo}>
      <View style={styles.drunkPreview}>
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.drunkImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.drunkImage, styles.photoPlaceholder]}>
            <Feather name="image" color={textSecondary} size={24} />
            <Text style={styles.placeholderText}>Tap to add</Text>
          </View>
        )}

        {isUploading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={primaryBackground} />
          </View>
        ) : null}

        {uri && !isUploading ? (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            disabled={isDeleting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="trash-2" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </LinearGradient>
  </PhotoTileBase>
);

const ToggleRow = ({ icon, label, value, onValueChange, activeColor }) => (
  <View style={styles.toggleRow}>
    <View style={styles.rowLeft}>
      {icon}
      <Text style={styles.rowLabelWithIcon}>{label}</Text>
    </View>
    <ToggleSwitch
      value={value}
      onValueChange={onValueChange}
      activeColor={activeColor}
    />
  </View>
);

const EditProfileScreen = ({ navigation }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(state?.user || null);
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

  const [pushEnabled, setPushEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    milestones: true,
    comments: true,
    friendsPosts: true,
    buddiesNear: false,
    liquorBars: false,
  });

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
          setPushEnabled(Boolean(fetchedUser.notificationsEnabled));
          dispatch({ type: "SET_USER", payload: fetchedUser });
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
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Photos</Text>
            <View style={styles.photoRow}>
              <ProfilePhotoTile
                label="Profile Photo"
                uri={profileUri}
                isUploading={uploadingSlot === "PROFILE"}
                isDeleting={deletingSlot === "PROFILE"}
                onPick={() => pickImage("PROFILE")}
                onDelete={() => deletePhoto("PROFILE")}
              />
              <DrunkPhotoTile
                label="Drunk Photo"
                uri={drunkUri}
                isUploading={uploadingSlot === "DRUNK"}
                isDeleting={deletingSlot === "DRUNK"}
                onPick={() => pickImage("DRUNK")}
                onDelete={() => deletePhoto("DRUNK")}
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setUsernameOpen((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={styles.rowLeft}>
                <Feather name="at-sign" size={18} color={accent} />
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowLabel}>Username</Text>
                  <Text style={styles.rowValue}>{usernameDisplay}</Text>
                </View>
              </View>
              <Feather
                name={usernameOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={textSecondary}
              />
            </TouchableOpacity>
            {usernameOpen ? (
              <View style={styles.dropdownBody}>
                <Text style={styles.helperText}>
                  This is how friends find you. Usernames must be unique.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  placeholderTextColor={textSecondary}
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={MAX_USERNAME_LENGTH}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                    if (isUsernameValid) handleSaveUsername();
                  }}
                />
                <Text
                  style={[
                    styles.validationText,
                    !isUsernameValid &&
                      trimmedUsername.length > 0 &&
                      styles.validationError,
                  ]}
                >
                  {usernameValidationText}
                </Text>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveUsername}
                  disabled={!isUsernameValid || savingUsername}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      !isUsernameValid || savingUsername
                        ? [border, border]
                        : [accent, accent]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.saveButtonInner,
                      (!isUsernameValid || savingUsername) &&
                        styles.saveButtonDisabled,
                    ]}
                  >
                    {savingUsername ? (
                      <ActivityIndicator color={nightBlue} />
                    ) : (
                      <Text style={styles.saveButtonText}>Save username</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setSocialOpen((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="share-social" size={18} color={oceanBlue} />
                <Text style={styles.rowLabelWithIcon}>Social links</Text>
              </View>
              <Feather
                name={socialOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={textSecondary}
              />
            </TouchableOpacity>

            {socialOpen ? (
              <>
                <Text style={styles.helperText}>
                  Add your usernames (Optional) so friends can tap straight to
                  your profile.
                </Text>

                {Object.entries(SOCIAL_CONFIG).map(([platform, config]) => {
                  const error = socialValidation[platform];

                  return (
                    <View key={platform} style={styles.socialRow}>
                      <View style={styles.rowLeft}>
                        {config.icon}
                        <Text style={styles.rowLabelWithIcon}>
                          {config.label}
                        </Text>
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder={config.placeholder}
                        placeholderTextColor={textSecondary}
                        value={socialInputs[platform] || ""}
                        onChangeText={(text) =>
                          setSocialInputs((prev) => ({
                            ...prev,
                            [platform]: text,
                          }))
                        }
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                      />
                      <Text
                        style={[
                          styles.validationText,
                          error ? styles.validationError : null,
                        ]}
                      >
                        {error || `Paste a link or ${config.placeholder}.`}
                      </Text>
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveSocialLinks}
                  disabled={!isSocialValid || savingSocial}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      !isSocialValid || savingSocial
                        ? [border, border]
                        : [accent, accent]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.saveButtonInner,
                      (!isSocialValid || savingSocial) &&
                        styles.saveButtonDisabled,
                    ]}
                  >
                    {savingSocial ? (
                      <ActivityIndicator color={nightBlue} />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        Save social links
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setNotificationsOpen((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="notifications" size={18} color={oceanBlue} />
                <Text style={styles.rowLabelWithIcon}>
                  Notification settings
                </Text>
              </View>
              <Feather
                name={notificationsOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={textSecondary}
              />
            </TouchableOpacity>
            {notificationsOpen ? (
              <View style={styles.dropdownBody}>
                <ToggleRow
                  icon={<Feather name="award" size={18} color={accent} />}
                  label="Milestones"
                  value={notificationPrefs.milestones}
                  onValueChange={(value) =>
                    setNotificationPrefs((prev) => ({
                      ...prev,
                      milestones: value,
                    }))
                  }
                  activeColor={accent}
                />
                <ToggleRow
                  icon={
                    <Feather
                      name="message-circle"
                      size={18}
                      color={oceanBlue}
                    />
                  }
                  label="Comments"
                  value={notificationPrefs.comments}
                  onValueChange={(value) =>
                    setNotificationPrefs((prev) => ({
                      ...prev,
                      comments: value,
                    }))
                  }
                  activeColor={oceanBlue}
                />
                <ToggleRow
                  icon={<Feather name="users" size={18} color={accent} />}
                  label="Friends posts"
                  value={notificationPrefs.friendsPosts}
                  onValueChange={(value) =>
                    setNotificationPrefs((prev) => ({
                      ...prev,
                      friendsPosts: value,
                    }))
                  }
                  activeColor={accent}
                />
                <ToggleRow
                  icon={
                    <MaterialCommunityIcons
                      name="beer"
                      size={18}
                      color={oceanBlue}
                    />
                  }
                  label="Buddies near bars"
                  value={notificationPrefs.buddiesNear}
                  onValueChange={(value) =>
                    setNotificationPrefs((prev) => ({
                      ...prev,
                      buddiesNear: value,
                    }))
                  }
                  activeColor={oceanBlue}
                />
                <ToggleRow
                  icon={
                    <MaterialCommunityIcons
                      name="glass-cocktail"
                      size={18}
                      color={accent}
                    />
                  }
                  label="Liquor & bars"
                  value={notificationPrefs.liquorBars}
                  onValueChange={(value) =>
                    setNotificationPrefs((prev) => ({
                      ...prev,
                      liquorBars: value,
                    }))
                  }
                  activeColor={accent}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Privacy</Text>
            <ToggleRow
              icon={<Ionicons name="notifications" size={18} color={accent} />}
              label="All push notifications"
              value={pushEnabled}
              onValueChange={setPushEnabled}
              activeColor={accent}
            />
            <ToggleRow
              icon={<Feather name="map-pin" size={18} color={oceanBlue} />}
              label="Location tracking"
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              activeColor={oceanBlue}
            />
            <Text style={styles.helperText}>
              We only use your location to catch when you might be hanging at a
              bar or liquor store so we can ping your sober buddies before you
              make any dumb decisions.
            </Text>
            <TouchableOpacity
              style={styles.deleteProfileButton}
              activeOpacity={0.9}
              disabled={deletingAccount}
              onPress={handleDeleteProfile}
            >
              <LinearGradient
                colors={["#991b1b", "#f97316"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.deleteProfileInner,
                  deletingAccount && { opacity: 0.85 },
                ]}
              >
                <Feather name="trash-2" size={16} color="#fff" />
                {deletingAccount ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteProfileText}>Delete profile</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
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
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  photoTile: {
    flex: 1,
    alignItems: "center",
  },
  profileHalo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 18,
    padding: 4,
    shadowColor: accent,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  profilePreview: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: nightBlue,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  drunkTile: {
    justifyContent: "flex-start",
  },
  drunkHalo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 18,
    padding: 4,
    shadowColor: oceanBlue,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  drunkPreview: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: nightBlue,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  drunkImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  placeholderText: {
    color: textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  photoLabel: {
    color: textPrimary,
    fontWeight: "700",
    fontSize: 14,
    marginTop: 10,
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    padding: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowTextBlock: {
    marginLeft: 10,
  },
  rowLabel: {
    color: textPrimary,
    fontWeight: "700",
  },
  rowLabelWithIcon: {
    color: textPrimary,
    fontWeight: "700",
    marginLeft: 12,
  },
  rowValue: {
    color: textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  dropdownBody: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: border,
    paddingTop: 12,
    paddingBottom: 4,
  },
  helperText: {
    color: textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  socialRow: {
    marginTop: 8,
  },
  input: {
    backgroundColor: nightBlue,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: textPrimary,
    marginTop: 10,
    marginBottom: 10,
  },
  validationText: {
    color: textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  validationError: {
    color: accent,
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonInner: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: nightBlue,
    fontWeight: "800",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: border,
  },
  deleteProfileButton: {
    marginTop: 18,
    borderRadius: 14,
    overflow: "hidden",
  },
  deleteProfileInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    borderRadius: 14,
  },
  deleteProfileText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  loadingScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,22,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EditProfileScreen;
