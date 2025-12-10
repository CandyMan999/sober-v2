import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { CameraView, Camera } from "expo-camera";
import { useVideoPlayer, VideoView } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

import { MaterialIcons, Feather } from "@expo/vector-icons";
import { ReactNativeFile } from "extract-files";
import Toast from "react-native-toast-message";

import { useClient } from "../../client";
import {
  SEND_IMAGE_POST_MUTATION,
  SEND_POST_MUTATION,
} from "../../GraphQL/mutations";
import { RecordButton, AlertModal, LogoLoader } from "../../components";
import Context from "../../context";

const MAX_DURATION_SECONDS = 120; // target 2 min
const RECORDING_QUALITY = "720p"; // slightly lower to help with upload reliability

const PostCaptureScreen = ({ navigation }) => {
  const cameraRef = useRef(null);
  const recordingStartRef = useRef(null); // track start time
  const client = useClient();
  const { state } = useContext(Context);
  const isFocused = useIsFocused(); // know when this screen is actually visible

  const [hasPermission, setHasPermission] = useState(null);
  const [facing, setFacing] = useState("front");
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(MAX_DURATION_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null); // "VIDEO" | "IMAGE"
  const [mediaMimeType, setMediaMimeType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const [error, setError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [showGalleryPicker, setShowGalleryPicker] = useState(true); // gallery button visibility

  // ----- expo-video player for preview -----
  const player = useVideoPlayer(
    mediaType === "VIDEO" && mediaUri ? { uri: mediaUri } : null,
    (playerInstance) => {
      playerInstance.loop = true;

      playerInstance.addListener("error", (e) => {
        console.log("🔥 Video player error:", e);
        handleError("This video can't be previewed on your device.");
      });
    }
  );

  // Play when focused + we have a video; pause when blurred
  useEffect(() => {
    if (!mediaUri || mediaType !== "VIDEO") return;

    if (isFocused) {
      try {
        player.play();
      } catch (e) {
        console.log("Error starting preview playback:", e);
      }
    } else {
      try {
        player.pause();
      } catch (e) {
        console.log("Error pausing preview on blur:", e);
      }
    }
  }, [mediaUri, mediaType, isFocused, player]);

  // ----- Permissions -----
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        const { status: audioStatus } =
          await Camera.requestMicrophonePermissionsAsync();

        setHasPermission(status === "granted" && audioStatus === "granted");
      } catch (e) {
        console.log("Camera permission error:", e);
        setHasPermission(false);
      }
    })();
  }, []);

  // ----- Reset when screen gains focus / loses focus -----
  useFocusEffect(
    useCallback(() => {
      // On focus: start fresh capture state
      setMediaUri(null);
      setMediaType(null);
      setMediaMimeType(null);
      setIsRecording(false);
      setUploading(false);
      setTimer(MAX_DURATION_SECONDS);
      setIsTimerRunning(false);
      setCaption("");
      recordingStartRef.current = null;
      setShowGalleryPicker(true);

      return () => {
        // On blur: just reset flags (camera + player are handled by isFocused)
        setIsRecording(false);
        setIsTimerRunning(false);
        recordingStartRef.current = null;
        setShowGalleryPicker(true);
        setMediaType(null);
        setMediaMimeType(null);
      };
    }, [])
  );

  // ----- Countdown timer (wall-clock based) -----
  useEffect(() => {
    let interval = null;

    if (isTimerRunning && recordingStartRef.current) {
      interval = setInterval(() => {
        const elapsedMs = Date.now() - recordingStartRef.current;
        const elapsedSec = Math.floor(elapsedMs / 1000);
        const remaining = Math.max(MAX_DURATION_SECONDS - elapsedSec, 0);

        setTimer(remaining);

        // If we've hit zero, make sure recording stops
        if (remaining === 0 && isRecording) {
          stopRecording();
        }
      }, 500); // update twice per second for better sync
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isRecording]);

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleError = (msg) => {
    setError(msg || "Something went wrong");
    setShowErrorModal(true);
    setUploading(false);
    setIsRecording(false);
    setIsTimerRunning(false);
    recordingStartRef.current = null;
    setShowGalleryPicker(true);
    setMediaUri(null);
    setMediaType(null);
    setMediaMimeType(null);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setError("");
  };

  const startRecording = async () => {
    try {
      if (!cameraRef.current || !isCameraReady || uploading) return;

      setIsRecording(true);
      setIsTimerRunning(true);
      setTimer(MAX_DURATION_SECONDS);
      setShowGalleryPicker(false); // hide gallery while recording

      const options = {
        quality: RECORDING_QUALITY,
        maxDuration: MAX_DURATION_SECONDS,
      };

      const startTime = Date.now();
      recordingStartRef.current = startTime; // mark the real start timem

      const data = await cameraRef.current.recordAsync(options);
      const endTime = Date.now();
      const durationSec = Math.round((endTime - startTime) / 1000);
      console.log("🎥 Recorded clip duration (approx):", durationSec, "s");

      setMediaUri(data?.uri || null);
      setMediaType("VIDEO");
      setMediaMimeType("video/mp4");

      setIsRecording(false);
      setIsTimerRunning(false);
      recordingStartRef.current = null;
      setShowGalleryPicker(true); // back to idle state after capture
    } catch (e) {
      console.log("recordAsync error:", e);
      handleError("Error recording video");
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
      setIsTimerRunning(false);
      recordingStartRef.current = null;
      setShowGalleryPicker(true);
    }
  };

  const handleRedo = () => {
    // Clearing mediaUri unmounts previews
    setMediaUri(null);
    setMediaType(null);
    setMediaMimeType(null);
    setCaption("");
    setIsRecording(false);
    setUploading(false);
    setTimer(MAX_DURATION_SECONDS);
    setIsTimerRunning(false);
    recordingStartRef.current = null;
    setShowGalleryPicker(true);
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setMediaUri(null);
    setMediaType(null);
    setMediaMimeType(null);
    setCaption("");
    navigation.navigate("HomeTabRoot");
  };

  const handlePickVideo = async () => {
    try {
      if (uploading || isRecording) return;

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        return Alert.alert(
          "Access needed",
          "Please enable photo library access so you can pick a video.",
          [{ text: "OK" }]
        );
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: MAX_DURATION_SECONDS,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      const pickedUri = asset?.uri;
      const pickedDurationMs = asset?.duration ?? 0; // Expo returns ms
      const pickedDurationSeconds =
        pickedDurationMs && pickedDurationMs > 0
          ? Math.ceil(pickedDurationMs / 1000)
          : null;

      if (!pickedUri) {
        return handleError("Couldn't read that video. Please try another one.");
      }

      setMediaUri(pickedUri);
      setMediaType("VIDEO");
      setMediaMimeType(asset?.mimeType || "video/mp4");
      setCaption("");
    } catch (e) {
      console.log("Error picking video:", e);
      handleError("Error selecting a video from your library.");
    }
  };

  const handlePickImage = async () => {
    try {
      if (uploading || isRecording) return;

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        return Alert.alert(
          "Access needed",
          "Please enable photo library access so you can pick a picture.",
          [{ text: "OK" }]
        );
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [3, 4],
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      const pickedUri = asset?.uri;

      if (!pickedUri) {
        return handleError("Couldn't read that image. Please try another one.");
      }

      setMediaUri(pickedUri);
      setMediaType("IMAGE");
      setMediaMimeType(asset?.mimeType || "image/jpeg");
      setCaption("");
    } catch (e) {
      console.log("Error picking image:", e);
      handleError("Error selecting a picture from your library.");
    }
  };

  const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // ~80 MB safety cap

  const handleSend = async () => {
    Keyboard.dismiss();

    if (!mediaUri || uploading) return;

    const senderID = state?.user?.id || null;
    if (!senderID) {
      return handleError("Missing user id for this post.");
    }

    const isImage = mediaType === "IMAGE";

    try {
      setUploading(true);

      const info = await FileSystem.getInfoAsync(mediaUri, { size: true });

      if (!info.exists) {
        throw new Error("We couldn't find that file on your device.");
      }

      if (info.size && info.size > MAX_UPLOAD_BYTES) {
        return handleError(
          "This video is too large to upload. Try trimming it or recording a shorter clip."
        );
      }

      // 2) Normalize URI to a guaranteed local file:// path
      let uploadUri = mediaUri;
      if (!uploadUri.startsWith("file://")) {
        const destPath =
          FileSystem.documentDirectory +
          `upload-${Date.now()}${isImage ? ".jpg" : ".mp4"}`;

        await FileSystem.copyAsync({ from: mediaUri, to: destPath });
        uploadUri = destPath;
      }

      const fileForUpload = new ReactNativeFile({
        uri: uploadUri,
        type: mediaMimeType || (isImage ? "image/jpeg" : "video/mp4"),
        name: isImage ? "post-image.jpg" : "post-video.mp4",
      });

      const response = await client.request(
        isImage ? SEND_IMAGE_POST_MUTATION : SEND_POST_MUTATION,
        {
          file: fileForUpload,
          senderID,
          text: caption?.trim?.() || null,
        }
      );

      const savedPost = isImage ? response?.sendImagePost : response?.sendPost;

      if (!savedPost) {
        throw new Error("We couldn't save your post. Please try again.");
      }

      Toast.show({
        type: "success",
        text1: "Post Sent",
        text2: "This post will soon be in the community.",
        position: "top",
        autoHide: true,
        visibilityTime: 6000,
        topOffset: 80,
      });

      setMediaUri(null);
      setMediaType(null);
      setMediaMimeType(null);
      setCaption("");

      navigation.navigate("HomeTabRoot");
    } catch (err) {
      console.log("❌ Error in handleSend:", err);
      const message =
        err?.response?.errors?.[0]?.message ||
        err?.message ||
        "Error sending your post. Please try again in a moment.";
      handleError(message);
    } finally {
      setUploading(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ----- Permission states -----
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color="#f59e0b" size="large" />
        <Text style={styles.loadingText}>Preparing camera…</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Camera & microphone access is required to record a message.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() =>
            Alert.alert(
              "Permissions",
              "Enable camera and microphone in your device settings to use this feature."
            )
          }
        >
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ----- Preview mode (video or image captured/picked) -----
  if (mediaUri) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.previewContainer}>
          {/* Upload / processing loader */}
          {uploading && <LogoLoader scanning />}

          {/* top close button in preview too */}
          <View style={styles.previewTopBar}>
            <TouchableOpacity style={styles.topButton} onPress={handleClose}>
              <Feather name="x" size={22} color="#f9fafb" />
            </TouchableOpacity>
          </View>

          {/* Media preview */}
          {mediaType === "VIDEO" && isFocused ? (
            <VideoView
              style={styles.fullScreenVideo}
              player={player}
              contentFit="contain"
              nativeControls
            />
          ) : null}

          {mediaType === "IMAGE" ? (
            <View style={styles.fullScreenImageWrapper}>
              <Image
                source={{ uri: mediaUri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* Bottom section moves a bit with keyboard */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
          >
            {/* Caption UI */}
            <View style={styles.captionContainer}>
              <Text style={styles.captionLabel}>Add a thought (optional)</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="What's on your mind right now?"
                placeholderTextColor="#6b7280"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={220}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              <View style={styles.captionFooter}>
                <Text style={styles.captionCounter}>{caption.length}/220</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.redoButton]}
                onPress={handleRedo}
                disabled={uploading}
              >
                <Text style={styles.actionText}>Redo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.useButton]}
                onPress={handleSend}
                disabled={uploading}
              >
                <Text style={[styles.actionText, styles.useText]}>
                  {uploading ? "Sending…" : "Post"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          <AlertModal
            visible={showErrorModal}
            type="error"
            message={error}
            onConfirm={closeErrorModal}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ----- Live camera mode -----
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Only mount the camera while this screen is focused */}
        {isFocused && (
          <CameraView
            style={styles.camera}
            ref={cameraRef}
            ratio="16:9"
            mode="video"
            facing={facing}
            onCameraReady={handleCameraReady}
          />
        )}

        {/* Top bar: close + timer + flip */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton} onPress={handleClose}>
            <Feather name="x" size={22} color="#f9fafb" />
          </TouchableOpacity>

          {isRecording && (
            <View style={styles.timerPill}>
              <View className="dot" style={styles.dot} />
              <Text style={styles.timerText}>{formatTimer(timer)}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.topButton}
            onPress={toggleCameraFacing}
          >
            <MaterialIcons name="flip-camera-ios" size={26} color="#f9fafb" />
          </TouchableOpacity>
        </View>

        {/* Bottom center: Record button (original position) + gallery bottom-left */}
        <View style={styles.bottomControls}>
          {isCameraReady && isFocused && (
            <>
              {showGalleryPicker && (
                <>
                  <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={handlePickImage}
                    disabled={uploading || isRecording}
                    activeOpacity={0.9}
                  >
                    <Feather
                      name="image"
                      size={20}
                      color={uploading || isRecording ? "#9ca3af" : "#f9fafb"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.videoGalleryButton}
                    onPress={handlePickVideo}
                    disabled={uploading || isRecording}
                    activeOpacity={0.9}
                  >
                    <Feather
                      name="video"
                      size={20}
                      color={uploading || isRecording ? "#9ca3af" : "#f9fafb"}
                    />
                  </TouchableOpacity>
                </>
              )}

              <RecordButton
                isRecording={isRecording}
                startRecording={startRecording}
                stopRecording={stopRecording}
              />
            </>
          )}
        </View>

        <AlertModal
          visible={showErrorModal}
          type="error"
          message={error}
          onConfirm={closeErrorModal}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },

  // Loading / permission
  loadingContainer: {
    flex: 1,
    backgroundColor: "#050816",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#e5e7eb",
    fontSize: 14,
  },
  errorText: {
    color: "#e5e7eb",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  permissionButtonText: {
    color: "#111827",
    fontWeight: "700",
  },

  // Top bar (camera mode)
  topBar: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#f87171",
    marginRight: 6,
  },
  timerText: {
    color: "#f9fafb",
    fontWeight: "600",
    fontSize: 14,
  },

  // Bottom controls
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  // Bottom-left gallery icon
  galleryButton: {
    position: "absolute",
    left: 24,
    bottom: 4,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoGalleryButton: {
    position: "absolute",
    right: 24,
    bottom: 4,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Preview mode
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewTopBar: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    zIndex: 15,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  fullScreenVideo: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  fullScreenImageWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },

  captionContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  captionLabel: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 6,
  },
  captionInput: {
    minHeight: 70,
    maxHeight: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#f9fafb",
    fontSize: 14,
  },
  captionFooter: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  captionCounter: {
    fontSize: 11,
    color: "#6b7280",
  },

  previewActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 50,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  redoButton: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  useButton: {
    backgroundColor: "#f59e0b",
  },
  actionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e5e7eb",
  },
  useText: {
    color: "#111827",
  },
});

export default PostCaptureScreen;
