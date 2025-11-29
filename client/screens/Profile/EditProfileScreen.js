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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { EXPO_CF_ACCOUNT_HASH, EXPO_CF_VARIANT } from "@env";

import AlertModal from "../../components/AlertModal";
import Context from "../../context";
import { useClient } from "../../client";
import {
  DIRECT_UPLOAD_MUTATION,
  ADD_PICTURE_MUTATION,
  DELETE_PHOTO_MUTATION,
  UPDATE_USER_PROFILE_MUTATION,
} from "../../GraphQL/mutations";
import { FETCH_ME_QUERY } from "../../GraphQL/queries";
import { getToken } from "../../utils/helpers";
import { COLORS } from "../../constants/colors";

const {
  primaryBackground,
  cardBackground,
  accent,
  accentSoft,
  accentDeep,
  textPrimary,
  textSecondary,
  border,
  gradientStart,
  gradientMid,
  gradientEnd,
  oceanBlue,
  nightBlue,
} = COLORS;

const MIN_USERNAME_LENGTH = 3;

const PhotoTile = ({
  label,
  helper,
  uri,
  isUploading,
  onPick,
  onDelete,
  style,
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={[styles.photoTile, style]}
    onPress={onPick}
  >
    <LinearGradient
      colors={[gradientStart, gradientMid]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.photoGradient}
    >
      <LinearGradient
        colors={[accentSoft, gradientMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.photoHalo}
      >
        <View style={styles.photoPreview}>
          {uri ? (
            <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Feather name="camera" color={textSecondary} size={26} />
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="trash-2" size={16} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.photoMeta}>
        <Text style={styles.photoLabel}>{label}</Text>
        {helper ? <Text style={styles.photoHelper}>{helper}</Text> : null}
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const FancyToggle = ({ value, onValueChange }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={() => onValueChange(!value)}
    style={styles.togglePressable}
  >
    <LinearGradient
      colors={value ? [accent, accentSoft] : [border, nightBlue]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.toggleTrack, value && styles.toggleTrackOn]}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </LinearGradient>
  </TouchableOpacity>
);

const ToggleRow = ({ icon, label, value, onValueChange }) => (
  <View style={styles.toggleRow}>
    <View style={styles.rowLeft}>
      <View style={styles.iconBadge}>{icon}</View>
      <Text style={styles.rowLabelWithIcon}>{label}</Text>
    </View>
    <FancyToggle value={value} onValueChange={onValueChange} />
  </View>
);

const EditProfileScreen = ({ navigation }) => {
  const client = useClient();
  const { state, dispatch } = useContext(Context);

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(state?.user || null);
  const [loading, setLoading] = useState(!state?.user);

  const [profileUri, setProfileUri] = useState(user?.profilePicUrl || null);
  const [drunkUri, setDrunkUri] = useState(user?.drunkPicUrl || null);
  const [profileId, setProfileId] = useState(user?.profilePic?.id || null);
  const [drunkId, setDrunkId] = useState(user?.drunkPic?.id || null);

  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [deletingSlot, setDeletingSlot] = useState(null);

  const [usernameOpen, setUsernameOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || "");
  const [savingUsername, setSavingUsername] = useState(false);

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

  const [alertState, setAlertState] = useState({ visible: false, title: "", message: "" });

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

        const data = await client.request(FETCH_ME_QUERY, { token: storedToken });
        const fetchedUser = data?.fetchMe;
        if (fetchedUser) {
          setUser(fetchedUser);
          setProfileUri(fetchedUser.profilePicUrl || null);
          setDrunkUri(fetchedUser.drunkPicUrl || null);
          setProfileId(fetchedUser.profilePic?.id || null);
          setDrunkId(fetchedUser.drunkPic?.id || null);
          setUsernameInput(fetchedUser.username || "");
          setPushEnabled(Boolean(fetchedUser.notificationsEnabled));
          dispatch({ type: "SET_USER", payload: fetchedUser });
        }
      } catch (err) {
        console.log("Failed to fetch profile", err);
        setAlertState({
          visible: true,
          title: "Profile error",
          message: "We couldn't load your profile right now. Please try again.",
        });
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
  }, [user]);

  const showError = (message, title = "Heads up") => {
    setAlertState({ visible: true, title, message });
  };

  const requestMediaPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showError("We need access to your library to update your photos.");
      return false;
    }
    return true;
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

      const deliveryUrl = `https://imagedelivery.net/${EXPO_CF_ACCOUNT_HASH}/${directUpload.id}/${EXPO_CF_VARIANT}`;

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
      showError("We need your device ID to update photos. Please restart the app.");
      return;
    }

    if (uploadingSlot || !(await requestMediaPermission())) return;

    setUploadingSlot(slot);

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: isProfile,
      aspect: isProfile ? [1, 1] : undefined,
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
      showError("We need your device ID to delete photos. Please restart the app.");
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
  const isUsernameValid = trimmedUsername.length >= MIN_USERNAME_LENGTH;
  const usernameValidationText = useMemo(() => {
    if (usernameInput.length === 0) return "You can change this later.";
    if (!isUsernameValid) return "At least 3 characters.";
    return "Looks good.";
  }, [isUsernameValid, usernameInput]);

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
      dispatch({ type: "SET_USER", payload: updateUserProfile });
      setUsernameOpen(false);
    } catch (err) {
      const message =
        err?.response?.errors?.[0]?.message ||
        "We couldn't update your username right now.";
      showError(message, "Username error");
    } finally {
      setSavingUsername(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backPill}
            onPress={() => navigation?.goBack?.()}
            accessibilityLabel="Go back"
            activeOpacity={0.85}
          >
            <Feather name="arrow-left" size={18} color={textPrimary} />
            <Text style={styles.backLabel}>Back to profile</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <Text style={styles.headerSubtitle}>
            Update your look and how you want to be notified.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Photos</Text>
          <View style={styles.photoRow}>
            <PhotoTile
              label="Profile photo"
              helper="Shows across your profile and replies."
              uri={profileUri}
              isUploading={uploadingSlot === "PROFILE"}
              onPick={() => pickImage("PROFILE")}
              onDelete={() => deletePhoto("PROFILE")}
              style={{ marginRight: 8 }}
            />
            <PhotoTile
              label="Drunk photo"
              helper="Keep as a before-and-after reminder."
              uri={drunkUri}
              isUploading={uploadingSlot === "DRUNK"}
              onPick={() => pickImage("DRUNK")}
              onDelete={() => deletePhoto("DRUNK")}
              style={{ marginLeft: 8 }}
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
              <View style={styles.iconBadge}>
                <Feather name="at-sign" size={18} color={accent} />
              </View>
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
              />
              <Text
                style={[
                  styles.validationText,
                  !isUsernameValid && trimmedUsername.length > 0 && styles.validationError,
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
                      : [accent, accentSoft]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.saveButtonInner, (!isUsernameValid || savingUsername) && styles.saveButtonDisabled]}
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
            onPress={() => setNotificationsOpen((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="notifications" size={18} color={oceanBlue} />
              </View>
              <Text style={styles.rowLabelWithIcon}>Notification settings</Text>
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
                  setNotificationPrefs((prev) => ({ ...prev, milestones: value }))
                }
              />
              <ToggleRow
                icon={<Feather name="message-circle" size={18} color={textSecondary} />}
                label="Comments"
                value={notificationPrefs.comments}
                onValueChange={(value) =>
                  setNotificationPrefs((prev) => ({ ...prev, comments: value }))
                }
              />
              <ToggleRow
                icon={<Feather name="users" size={18} color={accentSoft} />}
                label="Friends posts"
                value={notificationPrefs.friendsPosts}
                onValueChange={(value) =>
                  setNotificationPrefs((prev) => ({ ...prev, friendsPosts: value }))
                }
              />
              <ToggleRow
                icon={<MaterialCommunityIcons name="beer" size={18} color={accentDeep} />}
                label="Buddies near bars"
                value={notificationPrefs.buddiesNear}
                onValueChange={(value) =>
                  setNotificationPrefs((prev) => ({ ...prev, buddiesNear: value }))
                }
              />
              <ToggleRow
                icon={<MaterialCommunityIcons name="glass-cocktail" size={18} color={oceanBlue} />}
                label="Liquor & bars"
                value={notificationPrefs.liquorBars}
                onValueChange={(value) =>
                  setNotificationPrefs((prev) => ({ ...prev, liquorBars: value }))
                }
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
          />
          <ToggleRow
            icon={<Feather name="map-pin" size={18} color={oceanBlue} />}
            label="Location tracking"
            value={locationEnabled}
            onValueChange={setLocationEnabled}
          />
          <Text style={styles.helperText}>
            We only use your location to surface buddy alerts near bars and safe
            meetup spots.
          </Text>
        </View>
      </ScrollView>

      <AlertModal
        visible={alertState.visible}
        type="error"
        title={alertState.title}
        message={alertState.message}
        onConfirm={() => setAlertState({ visible: false, title: "", message: "" })}
      />
      {loading ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={accent} size="large" />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: primaryBackground,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  container: {
    flex: 1,
    backgroundColor: primaryBackground,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backLabel: {
    color: textPrimary,
    marginLeft: 8,
    fontWeight: "700",
  },
  headerTextBlock: {},
  headerTitle: {
    color: textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: textSecondary,
    fontSize: 13,
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
    marginBottom: 8,
  },
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  photoTile: {
    flex: 1,
  },
  photoGradient: {
    borderRadius: 14,
    padding: 10,
    height: 210,
    borderWidth: 1,
    borderColor: border,
    shadowColor: accent,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  photoHalo: {
    borderRadius: 12,
    padding: 3,
  },
  photoPreview: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: nightBlue,
    height: 140,
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  photoMeta: {
    marginTop: 10,
  },
  photoLabel: {
    color: textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  photoHelper: {
    color: textSecondary,
    fontSize: 12,
    marginTop: 4,
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
  iconBadge: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
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
  input: {
    backgroundColor: nightBlue,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: textPrimary,
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
  togglePressable: {
    paddingLeft: 8,
  },
  toggleTrack: {
    width: 56,
    height: 30,
    borderRadius: 20,
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  toggleTrackOn: {
    shadowColor: accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#e5e7eb",
    alignSelf: "flex-start",
  },
  toggleThumbOn: {
    alignSelf: "flex-end",
    backgroundColor: nightBlue,
  },
  loadingScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,22,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EditProfileScreen;
