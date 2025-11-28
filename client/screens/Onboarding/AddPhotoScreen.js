import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { MaterialIcons } from "@expo/vector-icons";
import { useClient } from "../../client";
import {
  DIRECT_UPLOAD_MUTATION,
  ADD_PICTURE_MUTATION,
  DELETE_PHOTO_MUTATION,
} from "../../GraphQL/mutations";
import { EXPO_CF_ACCOUNT_HASH, EXPO_CF_VARIANT } from "@env";

import LogoIcon from "../../assets/icon.png";
import { COLORS } from "../../constants/colors";
const {
  primaryBackground,
  cardBackground,
  accent,

  textPrimary,
  textSecondary,

  border,
} = COLORS;

const AddPhotoScreen = ({ navigation, route }) => {
  const client = useClient();
  const username = route?.params?.username || "you";
  const token = route?.params?.pushToken || null;

  const { accent, accentSoft } = COLORS;

  // flow state
  const [step, setStep] = useState(1);

  // animation for step content
  const [contentAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    contentAnim.setValue(0);
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step, contentAnim]);

  // profile photo state
  const [profileUri, setProfileUri] = useState(route?.params?.photoURI || null);
  const [profileId, setProfileId] = useState(null);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileDeleting, setProfileDeleting] = useState(false);

  // drunk photo state
  const [drunkUri, setDrunkUri] = useState(null);
  const [drunkId, setDrunkId] = useState(null);
  const [drunkUploading, setDrunkUploading] = useState(false);
  const [drunkDeleting, setDrunkDeleting] = useState(false);

  const requestMediaPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos.");
      return false;
    }
    return true;
  };

  const uploadToCloudflare = async (localUri, slot) => {
    try {
      const { directUpload } = await client.request(DIRECT_UPLOAD_MUTATION);

      if (!directUpload?.uploadURL) throw new Error("Missing upload URL");

      const fd = new FormData();
      fd.append("file", {
        uri: localUri,
        type: "image/jpeg",
        name: "upload.jpg",
      });

      const uploadRes = await fetch(directUpload.uploadURL, {
        method: "POST",
        body: fd,
      });

      if (!uploadRes.ok) throw new Error("Cloudflare upload failed");

      const deliveryUrl = `https://imagedelivery.net/${EXPO_CF_ACCOUNT_HASH}/${directUpload.id}/${EXPO_CF_VARIANT}`;

      const { addPicture } = await client.request(ADD_PICTURE_MUTATION, {
        token,
        url: deliveryUrl,
        publicId: directUpload.id,
        slot,
      });

      return { url: deliveryUrl, id: addPicture.id };
    } catch (err) {
      console.log("Upload error:", err);
      Alert.alert("Upload failed", "Please try again.");
      return null;
    }
  };

  const pickImage = async (slot) => {
    const uploading = slot === "PROFILE" ? profileUploading : drunkUploading;
    if (!(await requestMediaPermission()) || uploading) return;

    if (slot === "PROFILE") setProfileUploading(true);
    else setDrunkUploading(true);

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: slot === "PROFILE" ? true : false,
      aspect: slot === "PROFILE" ? [1, 1] : [3, 4],
      quality: 1,
    });

    if (result.canceled) {
      if (slot === "PROFILE") setProfileUploading(false);
      else setDrunkUploading(false);
      return;
    }

    const resized = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 900 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // optimistic preview
    if (slot === "PROFILE") setProfileUri(resized.uri);
    else setDrunkUri(resized.uri);

    const uploaded = await uploadToCloudflare(resized.uri, slot);

    if (uploaded) {
      if (slot === "PROFILE") {
        setProfileUri(uploaded.url);
        setProfileId(uploaded.id);
      } else {
        setDrunkUri(uploaded.url);
        setDrunkId(uploaded.id);
      }
    }

    if (slot === "PROFILE") setProfileUploading(false);
    else setDrunkUploading(false);
  };

  const deletePhoto = async (slot) => {
    const photoId = slot === "PROFILE" ? profileId : drunkId;
    const deleting = slot === "PROFILE" ? profileDeleting : drunkDeleting;

    if (!photoId || deleting) return;

    if (slot === "PROFILE") setProfileDeleting(true);
    else setDrunkDeleting(true);

    try {
      await client.request(DELETE_PHOTO_MUTATION, { token, photoId, slot });

      if (slot === "PROFILE") {
        setProfileUri(null);
        setProfileId(null);
      } else {
        setDrunkUri(null);
        setDrunkId(null);
      }
    } catch (err) {
      console.log("Delete error:", err);
    }

    if (slot === "PROFILE") setProfileDeleting(false);
    else setDrunkDeleting(false);
  };

  const goNext = () => {
    if (step === 1) {
      if (!profileUri) return;
      setStep(2);
    } else {
      navigation.navigate("AddSobrietyDate", { pushToken: token });
    }
  };

  // Disable button on BOTH steps until that step's image exists
  const isPrimaryDisabled =
    (step === 1 && !profileUri) || (step === 2 && !drunkUri);

  const animatedContentStyle = {
    opacity: contentAnim,
    transform: [
      {
        translateY: contentAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  return (
    <LinearGradient
      colors={["#020617", "#020617", "#111827"]}
      style={styles.root}
    >
      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Image source={LogoIcon} style={styles.logo} resizeMode="contain" />
            <View>
              <Text style={styles.appName}>
                sober <Text style={styles.appAccent}>motivation</Text>
              </Text>
              <Text style={styles.tagline}>Your story deserves a face</Text>
            </View>
          </View>
        </View>

        {/* Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>STEP 3 OF 4</Text>

            <Animated.View style={animatedContentStyle}>
              {step === 1 ? (
                <>
                  <Text style={styles.title}>
                    Add a <Text style={styles.titleAccent}>profile photo</Text>
                  </Text>
                  <Text style={styles.helper}>
                    A clear photo helps the community recognize and cheer for
                    you {username}.
                  </Text>

                  {/* Circle upload */}
                  <View style={styles.avatarWrapper}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => pickImage("PROFILE")}
                      disabled={profileUploading || profileDeleting}
                    >
                      <LinearGradient
                        colors={["#F97316", "#FACC15"]}
                        style={styles.avatarRing}
                      >
                        <View style={styles.avatarInner}>
                          {profileUploading ? (
                            <ActivityIndicator size="large" color="#FACC15" />
                          ) : profileUri ? (
                            <Image
                              source={{ uri: profileUri }}
                              style={styles.avatarImage}
                            />
                          ) : (
                            <View style={styles.avatarEmptyContent}>
                              <MaterialIcons
                                name="photo-camera"
                                size={32}
                                color="#9CA3AF"
                              />
                              <Text style={styles.avatarTapText}>
                                Tap to add photo
                              </Text>
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    {profileUri && !profileUploading && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deletePhoto("PROFILE")}
                        disabled={profileDeleting}
                      >
                        {profileDeleting ? (
                          <ActivityIndicator size="small" color="#F97373" />
                        ) : (
                          <MaterialIcons
                            name="delete"
                            size={20}
                            color="#F97373"
                          />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.title}>
                    Add a <Text style={styles.titleAccent}>drunk photo</Text>
                  </Text>
                  <Text style={styles.helper}>
                    For the before and after glow-up.
                  </Text>

                  {/* Portrait upload */}
                  <View style={styles.drunkWrapper}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => pickImage("DRUNK")}
                      disabled={drunkUploading || drunkDeleting}
                    >
                      <LinearGradient
                        colors={["#6366F1", "#22D3EE"]}
                        style={styles.drunkFrame}
                      >
                        <View style={styles.drunkInner}>
                          {drunkUploading ? (
                            <ActivityIndicator size="large" color="#22D3EE" />
                          ) : drunkUri ? (
                            <Image
                              source={{ uri: drunkUri }}
                              style={styles.drunkImage}
                            />
                          ) : (
                            <View style={styles.drunkEmpty}>
                              <MaterialIcons
                                name="photo-camera"
                                size={32}
                                color="#9CA3AF"
                              />
                              <Text style={styles.drunkTapText}>
                                Tap to add
                              </Text>
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    {drunkUri && !drunkUploading && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deletePhoto("DRUNK")}
                        disabled={drunkDeleting}
                      >
                        {drunkDeleting ? (
                          <ActivityIndicator size="small" color="#F97373" />
                        ) : (
                          <MaterialIcons
                            name="delete"
                            size={20}
                            color="#F97373"
                          />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </Animated.View>

            {/* Next / Continue button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                isPrimaryDisabled && styles.primaryButtonDisabled,
              ]}
              disabled={isPrimaryDisabled}
              onPress={goNext}
              activeOpacity={isPrimaryDisabled ? 1 : 0.85}
            >
              <LinearGradient
                colors={
                  isPrimaryDisabled
                    ? ["#4B5563", "#6B7280"]
                    : [accent, accentSoft]
                }
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryText}>
                  {step === 1 ? "Next" : "Continue"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Skip for now on profile step -> go straight to AddSobrietyDate */}
            {step === 1 && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("AddSobrietyDate", { pushToken: token })
                }
                style={styles.skipWrapper}
              >
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            )}

            {/* Skip on drunk step -> also go to AddSobrietyDate */}
            {step === 2 && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("AddSobrietyDate", { pushToken: token })
                }
                style={styles.skipWrapper}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: primaryBackground },
  flex: { flex: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },
  header: { marginBottom: 24 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 44, height: 44, borderRadius: 10, marginRight: 12 },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    textTransform: "uppercase",
    color: textPrimary,
  },
  appAccent: { color: accent },
  tagline: { marginTop: 4, color: textSecondary, fontSize: 14 },
  cardContainer: { flex: 1, justifyContent: "center" },
  card: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: cardBackground,
    borderWidth: 1,
    borderColor: border,
  },

  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: textSecondary,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: textPrimary,
    marginBottom: 8,
  },
  titleAccent: { color: accent },
  helper: { color: textSecondary, fontSize: 14, marginBottom: 20 },

  // profile UI
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  avatarRing: { width: 150, height: 150, padding: 4, borderRadius: 999 },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 999 },
  avatarEmptyContent: { alignItems: "center", justifyContent: "center" },
  avatarTapText: { marginTop: 8, color: textSecondary, fontSize: 13 },

  // drunk UI
  drunkWrapper: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  drunkFrame: {
    width: 160,
    height: 220,
    padding: 4,
    borderRadius: 16,
  },
  drunkInner: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  drunkImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  drunkEmpty: { alignItems: "center", justifyContent: "center" },
  drunkTapText: { marginTop: 6, color: textSecondary, fontSize: 13 },

  deleteButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#111827",
    borderRadius: 20,
    width: 32,
    height: 32,
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

  primaryButton: {
    marginTop: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  primaryButtonDisabled: {
    opacity: 0.9,
  },
  primaryGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  primaryText: { color: "#111", fontSize: 16, fontWeight: "700" },
  skipWrapper: { marginTop: 12, alignItems: "center" },
  skipText: { color: "#9CA3AF", textDecorationLine: "underline" },
});

export default AddPhotoScreen;
