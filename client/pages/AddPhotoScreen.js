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
  UPDATE_USER_PROFILE_MUTATION,
} from "../GraphQL/mutations";
import { EXPO_CF_ACCOUNT_HASH, EXPO_CF_VARIANT } from "@env";

const PRIMARY_BG = "#050816";
const CARD_BG = "rgba(15,23,42,0.96)";
const ACCENT = "#F59E0B";
const ACCENT_SOFT = "#FBBF24";

const AddPhotoScreen = ({ navigation, route }) => {
  const client = useClient();
  const username = route?.params?.username || "you";

  const [photoUri, setPhotoUri] = useState(null); // remote/local preview
  const [uploading, setUploading] = useState(false);

  console.log("HASH:", EXPO_CF_ACCOUNT_HASH);
  console.log("VARIANT:", EXPO_CF_VARIANT);

  // TEMP: same dev token as username screen
  const DEV_TOKEN = "dev-token-placeholder";

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

  const handlePickImage = async () => {
    try {
      if (!(await requestMediaPermission())) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      const originalUri = result.assets[0].uri;

      // Resize/compress
      const resized = await ImageManipulator.manipulateAsync(
        originalUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Optimistic local preview
      setPhotoUri(resized.uri);
      setUploading(true);

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

      // ---- STEP 4: SAVE ON USER PROFILE ----
      console.log("➡️ Calling UPSERT_USER_PROFILE_MUTATION...");
      const { updateUserProfile } = await client.request(
        UPDATE_USER_PROFILE_MUTATION,
        { username, token: DEV_TOKEN, profilePicUrl: deliveryUrl }
      );
      console.log("✅ User profile updated with photo: ", updateUserProfile);

      // Use remote URL for preview now
      setPhotoUri(deliveryUrl);
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

  const handleContinue = () => {
    if (uploading) return;
    // Navigate to sobriety date screen
    navigation.navigate("AddSobrietyDate", {
      username,
      profilePicUrl: photoUri,
    });
  };

  const handleSkip = () => {
    if (uploading) return;
    // Skip photo but still go to sobriety date screen
    navigation.navigate("AddSobrietyDate", {
      username,
      profilePicUrl: null,
    });
  };

  const canContinue = !!photoUri && !uploading;

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
            Faces make the journey feel real. Share yours if you're ready.
          </Text>
        </View>

        {/* Card Container - centers the card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
          <Text style={styles.sectionLabel}>Step 2 of 3</Text>

          <Text style={styles.title}>
            Add a <Text style={styles.titleAccent}>profile photo</Text>
          </Text>

          <Text style={styles.helper}>
            A clear photo helps the community recognize you and cheer for{" "}
            {username}.
          </Text>

          {/* Avatar preview (now tappable area) */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.85}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <LinearGradient
              colors={["#F97316", "#FACC15"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                {uploading ? (
                  <ActivityIndicator size="large" color="#FACC15" />
                ) : photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.avatarImage}
                  />
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

          {/* Primary CTA */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!canContinue || uploading) && { opacity: 0.6 },
            ]}
            activeOpacity={0.9}
            onPress={handleContinue}
            disabled={!canContinue || uploading}
          >
            <LinearGradient
              colors={
                canContinue && !uploading
                  ? [ACCENT, ACCENT_SOFT]
                  : ["#4B5563", "#4B5563"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              {uploading ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <Text style={styles.primaryText}>
                  Save & enter the community
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Skip link */}
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipWrapper}
            activeOpacity={uploading ? 1 : 0.7}
            disabled={uploading}
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
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 16,
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
