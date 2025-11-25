// pages/AddPhotoScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { MaterialIcons } from "@expo/vector-icons";
import { useClient } from "../client";
import {
  DIRECT_UPLOAD_MUTATION,
  ADD_PICTURE_MUTATION,
  DELETE_PHOTO_MUTATION,
} from "../GraphQL/mutations";
import { EXPO_CF_ACCOUNT_HASH, EXPO_CF_VARIANT } from "@env";

const PRIMARY_BG = "#050816";
const CARD_BG = "rgba(15,23,42,0.96)";
const ACCENT = "#F59E0B";
const ACCENT_SOFT = "#FBBF24";
const SLOT = {
  PROFILE: "PROFILE",
  DRUNK: "DRUNK",
};

const AddPhotoScreen = ({ navigation, route }) => {
  const client = useClient();
  const username = route?.params?.username || "you";
  const token = route?.params?.pushToken || null;
  const [profilePhotoUri, setProfilePhotoUri] = useState(
    route?.params?.photoURI ? route.params.photoURI : null
  ); // remote/local preview
  const [profilePhotoId, setProfilePhotoId] = useState(null); // picture ID for deletion
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileDeleting, setProfileDeleting] = useState(false);

  const [drunkPhotoUri, setDrunkPhotoUri] = useState(null);
  const [drunkPhotoId, setDrunkPhotoId] = useState(null);
  const [drunkUploading, setDrunkUploading] = useState(false);
  const [drunkDeleting, setDrunkDeleting] = useState(false);

  console.log("HASH:", EXPO_CF_ACCOUNT_HASH);
  console.log("VARIANT:", EXPO_CF_VARIANT);

  const requestMediaPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need access to your photos to upload a profile picture."
      );
      return false;
    }
    return true;
  };

  const getSlotState = (slot) => {
    const isDrunk = slot === SLOT.DRUNK;

    return {
      uri: isDrunk ? drunkPhotoUri : profilePhotoUri,
      setUri: isDrunk ? setDrunkPhotoUri : setProfilePhotoUri,
      photoId: isDrunk ? drunkPhotoId : profilePhotoId,
      setPhotoId: isDrunk ? setDrunkPhotoId : setProfilePhotoId,
      uploading: isDrunk ? drunkUploading : profileUploading,
      setUploading: isDrunk ? setDrunkUploading : setProfileUploading,
      deleting: isDrunk ? drunkDeleting : profileDeleting,
      setDeleting: isDrunk ? setDrunkDeleting : setProfileDeleting,
    };
  };

  const handlePickImage = async (slot) => {
    const { setUri, setPhotoId, uploading, setUploading } = getSlotState(slot);

    try {
      if (uploading) return;

      if (!(await requestMediaPermission())) return;

      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const originalUri = result.assets[0].uri;

      // Resize/compress
      const resized = await ImageManipulator.manipulateAsync(
        originalUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Optimistic local preview
      setUri(resized.uri);

      // ---- STEP 1: GET DIRECT UPLOAD TICKET FROM BACKEND ----
      let directUpload;
      try {
        console.log("➡️ Requesting DIRECT_UPLOAD_MUTATION...");
        const data = await client.request(DIRECT_UPLOAD_MUTATION);
        directUpload = data?.directUpload;
        console.log("✅ directUpload response:", directUpload);
      } catch (err) {
        console.log("❌ Error calling DIRECT_UPLOAD_MUTATION:", err);
        throw new Error("Failed to contact API for direct upload URL");
      }

      const { uploadURL, id } = directUpload || {};
      console.log("uploadURL:", uploadURL, "id:", id);

      if (!uploadURL) {
        throw new Error("No uploadURL returned from directUpload");
      }

      // ---- STEP 2: UPLOAD TO CLOUDFLARE ----
      const fd = new FormData();
      fd.append("file", {
        uri: resized.uri,
        type: "image/jpeg",
        name: "profile.jpg",
      });

      console.log("➡️ Uploading to Cloudflare:", uploadURL);

      const res = await fetch(uploadURL, {
        method: "POST",
        body: fd,
        // DO NOT manually set Content-Type
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.log("❌ Cloudflare upload failed:", res.status, text);
        throw new Error(`Cloudflare upload failed: ${res.status} ${text}`);
      }

      console.log("✅ Cloudflare upload success");

      // ---- STEP 3: BUILD DELIVERY URL ----
      const hash = EXPO_CF_ACCOUNT_HASH;
      const variant = EXPO_CF_VARIANT || "public";

      if (!hash) {
        console.warn(
          "EXPO_CF_ACCOUNT_HASH is not set – using local resized URI as fallback"
        );
      }

      const deliveryUrl = hash
        ? `https://imagedelivery.net/${hash}/${id}/${variant}`
        : resized.uri;

      console.log("Final delivery URL:", deliveryUrl);

      // ---- STEP 4: SAVE PICTURE TO DATABASE ----
      console.log("➡️ Calling ADD_PICTURE_MUTATION...");
      const { addPicture } = await client.request(ADD_PICTURE_MUTATION, {
        token,
        url: deliveryUrl,
        publicId: id,
        slot,
      });
      console.log("✅ Picture added: ", addPicture);

      // Use remote URL for preview and store picture ID
      setUri(deliveryUrl);
      setPhotoId(addPicture.id);
      setUploading(false);
    } catch (err) {
      console.log("Photo upload error (outer catch):", err?.name, err?.message);
      console.log("Full error object:", err);
      setUploading(false);
      Alert.alert(
        "Upload failed",
        "We couldn’t upload your photo right now. Please try again."
      );
    }
  };

  const handleDeletePhoto = async (slot) => {
    const { photoId, deleting, uploading, setUri, setPhotoId, setDeleting } =
      getSlotState(slot);

    if (!photoId || deleting || uploading) return;

    try {
      setDeleting(true);
      console.log("➡️ Calling DELETE_PHOTO_MUTATION...", photoId);
      const { deletePhoto } = await client.request(DELETE_PHOTO_MUTATION, {
        token,
        photoId: photoId,
        slot,
      });
      console.log("✅ Photo deleted: ", deletePhoto);

      // Clear local state
      setUri(null);
      setPhotoId(null);
    } catch (err) {
      console.log("Error deleting photo:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleContinue = () => {
    const isBusy = profileUploading || drunkUploading;
    if (isBusy) return;

    navigation.navigate("AddSobrietyDate", {
      pushToken: token,
    });
  };

  const handleSkip = () => {
    const isBusy = profileUploading || drunkUploading;
    if (isBusy) return;
    navigation.navigate("AddSobrietyDate", {
      pushToken: token,
    });
  };

  const hasAnyPhoto = !!profilePhotoUri || !!drunkPhotoUri;
  const PhotoSlot = ({ slot, title, helper, accentColors }) => {
    const { uri, uploading, deleting } = getSlotState(slot);

    return (
      <View style={styles.slotSection}>
        <Text style={styles.slotTitle}>{title}</Text>
        {helper ? <Text style={styles.slotHelper}>{helper}</Text> : null}

        <View style={styles.avatarWrapper}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handlePickImage(slot)}
              disabled={uploading || deleting}
            >
              <LinearGradient
                colors={accentColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
                  {uploading ? (
                    <ActivityIndicator size="large" color={accentColors[1]} />
                  ) : uri ? (
                    <Image source={{ uri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarEmptyContent}>
                      <MaterialIcons
                        name="photo-camera"
                        size={32}
                        color="#9CA3AF"
                      />
                      <Text style={styles.avatarTapText}>Tap to add photo</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
            {/* Delete button - only show when photo exists */}
            {uri && !uploading && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePhoto(slot)}
                disabled={deleting}
                activeOpacity={0.7}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#F97373" />
                ) : (
                  <MaterialIcons name="delete" size={24} color="#F97373" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const canContinue = hasAnyPhoto && !(profileUploading || drunkUploading);

  return (
    <LinearGradient
      colors={["#020617", "#020617", "#111827"]}
      style={styles.root}
    >
      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>
            sober <Text style={styles.appAccent}>motivation</Text>
          </Text>
          <Text style={styles.tagline}>
            Faces make the journey feel real. Add your photo and, if you want,
            the "before" shot too.
          </Text>
        </View>

        {/* Card Container - centers the card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Step 3 of 4</Text>

            <Text style={styles.title}>
              Add a <Text style={styles.titleAccent}>profile photo</Text>
            </Text>

            <Text style={styles.helper}>
              A clear photo helps the community recognize and cheer for you{" "}
              {username}.
            </Text>

            <PhotoSlot
              slot={SLOT.PROFILE}
              title="Your profile photo"
              helper="This is what people will see on your posts and comments."
              accentColors={["#F97316", "#FACC15"]}
            />

            <View style={styles.divider} />

            <Text style={styles.subtitle}>Add a "day one" photo (optional)</Text>
            <Text style={styles.helper}>
              Hey, want to save a photo from your drinking days? We'll keep it
              as a before/after reminder alongside your progress.
            </Text>

            <PhotoSlot
              slot={SLOT.DRUNK}
              title="Day one / drinking days"
              helper="Upload a pic from back then so you can compare it to how you're doing now."
              accentColors={["#6366F1", "#22D3EE"]}
            />

            {/* Primary CTA */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!canContinue || profileUploading || drunkUploading) && {
                  opacity: 0.6,
                },
              ]}
              activeOpacity={0.9}
              onPress={handleContinue}
              disabled={!canContinue || profileUploading || drunkUploading}
            >
              <LinearGradient
                colors={
                  canContinue && !(profileUploading || drunkUploading)
                    ? [ACCENT, ACCENT_SOFT]
                    : ["#4B5563", "#4B5563"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                {profileUploading || drunkUploading ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.primaryText}>Next</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Skip link */}
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipWrapper}
              activeOpacity={profileUploading || drunkUploading ? 1 : 0.7}
              disabled={profileUploading || drunkUploading}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PRIMARY_BG,
  },
  flex: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#E5E7EB",
  },
  appAccent: {
    color: ACCENT,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: "#9CA3AF",
  },
  card: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  titleAccent: {
    color: ACCENT,
  },
  helper: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 8,
    marginTop: 4,
  },
  slotSection: {
    marginBottom: 12,
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 6,
  },
  slotHelper: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 10,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(148,163,184,0.25)",
    marginVertical: 18,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#111827",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F97373",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  avatarRing: {
    width: 140,
    height: 140,
    borderRadius: 999,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  avatarEmptyContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTapText: {
    marginTop: 8,
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  primaryButton: {
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 12,
  },
  primaryGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  primaryText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  skipWrapper: {
    marginTop: 10,
    alignItems: "center",
  },
  skipText: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "underline",
  },
});

export default AddPhotoScreen;
