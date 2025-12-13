import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import { COLORS } from "../../../../constants/colors";
import { useClient } from "../../../../client";
import Context from "../../../../context";
import {
  ADD_PICTURE_MUTATION,
  DELETE_PHOTO_MUTATION,
  DIRECT_UPLOAD_MUTATION,
} from "../../../../GraphQL/mutations";
import { getToken } from "../../../../utils/helpers";

const { accent, textPrimary, textSecondary, primaryBackground, oceanBlue } =
  COLORS;

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

const PhotoTilesSection = ({ currentUser, onUserUpdated, showError }) => {
  const client = useClient();
  const { dispatch } = useContext(Context);

  console.log("current User: ", currentUser);

  const [profileUri, setProfileUri] = useState(
    currentUser?.profilePicUrl || null
  );
  const [drunkUri, setDrunkUri] = useState(currentUser?.drunkPicUrl || null);
  const [profileId, setProfileId] = useState(
    currentUser?.profilePic?.id || null
  );
  const [drunkId, setDrunkId] = useState(currentUser?.drunkPic?.id || null);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [deletingSlot, setDeletingSlot] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    setProfileUri(currentUser?.profilePicUrl || null);
    setDrunkUri(currentUser?.drunkPicUrl || null);
    setProfileId(currentUser?.profilePic?.id || null);
    setDrunkId(currentUser?.drunkPic?.id || null);
  }, [currentUser]);

  useEffect(() => {
    const fetchToken = async () => {
      const deviceToken = await getToken();
      setToken(deviceToken);
    };

    fetchToken();
  }, []);

  const requestMediaPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showError?.("We need access to your library to update your photos.");
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
      showError?.("We couldn't upload that photo. Please try again.");
      return null;
    }
  };

  const pickImage = async (slot) => {
    const isProfile = slot === "PROFILE";
    if (!token) {
      showError?.(
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
    console.log("deleting: ", slot);
    const isProfile = slot === "PROFILE";
    const photoId = isProfile ? profileId : drunkId;

    console.log("photoID: ", photoId);
    if (!photoId || deletingSlot) return;
    if (!token) {
      showError?.(
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

      dispatch({ type: "SET_USER", payload: deletePhoto });
      onUserUpdated?.(deletePhoto);
      if (isProfile) {
        setProfileUri(null);
        setProfileId(null);
      } else {
        setDrunkUri(null);
        setDrunkId(null);
      }
    } catch (err) {
      console.log("Delete error", err);
      showError?.("We couldn't delete that photo. Please try again.");
    }

    setDeletingSlot(null);
  };

  const uploadingState = useMemo(() => uploadingSlot, [uploadingSlot]);
  const deletingState = useMemo(() => deletingSlot, [deletingSlot]);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionLabel}>Photos</Text>
      <View style={styles.photoRow}>
        <ProfilePhotoTile
          label="Profile Photo"
          uri={profileUri}
          isUploading={uploadingState === "PROFILE"}
          isDeleting={deletingState === "PROFILE"}
          onPick={() => pickImage("PROFILE")}
          onDelete={() => deletePhoto("PROFILE")}
        />
        <DrunkPhotoTile
          label="Drunk Photo"
          uri={drunkUri}
          isUploading={uploadingState === "DRUNK"}
          isDeleting={deletingState === "DRUNK"}
          onPick={() => pickImage("DRUNK")}
          onDelete={() => deletePhoto("DRUNK")}
        />
      </View>
    </View>
  );
};

export default PhotoTilesSection;

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 16,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.nightBlue,
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
    backgroundColor: COLORS.nightBlue,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  drunkImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
});
