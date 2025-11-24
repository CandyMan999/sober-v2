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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { CameraView, Camera } from "expo-camera";
import { useVideoPlayer, VideoView } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { ReactNativeFile } from "extract-files";
import Toast from "react-native-toast-message";

import { useClient } from "../../client";
import { SEND_POST_MUTATION } from "../../GraphQL/mutations";
import { RecordButton, AlertModal, LogoLoader } from "../../components";
import Context from "../../context";

const MAX_DURATION_SECONDS = 120; // target 2 min
const RECORDING_QUALITY = "720p"; // slightly lower to help with upload reliability

const PostCaptureScreen = ({ navigation }) => {
  const cameraRef = useRef(null);
  const recordingStartRef = useRef(null); // 🔹 track start time
  const client = useClient();
  const { state, dispatch } = useContext(Context);
  const isFocused = useIsFocused(); // know when this screen is actually visible

  const [hasPermission, setHasPermission] = useState(null);
  const [facing, setFacing] = useState("front");
  const [isCameraReady, setIsCameraReady] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(MAX_DURATION_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [videoUri, setVideoUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const [error, setError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  // ----- expo-video player for preview -----
  const player = useVideoPlayer(
    videoUri ? { uri: videoUri } : null,
    (playerInstance) => {
      playerInstance.loop = true;
    }
  );

  // Play when focused + we have a video; pause when blurred
  useEffect(() => {
    if (!videoUri) return;

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
  }, [videoUri, isFocused, player]);

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
      setVideoUri(null);
      setIsRecording(false);
      setUploading(false);
      setTimer(MAX_DURATION_SECONDS);
      setIsTimerRunning(false);
      setCaption("");
      recordingStartRef.current = null;

      return () => {
        // On blur: just reset flags (camera + player are handled by isFocused)
        setIsRecording(false);
        setIsTimerRunning(false);
        recordingStartRef.current = null;
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

      const options = {
        quality: RECORDING_QUALITY,
        maxDuration: MAX_DURATION_SECONDS,
      };

      const startTime = Date.now();
      recordingStartRef.current = startTime; // 🔹 mark the real start time

      const data = await cameraRef.current.recordAsync(options);
      const endTime = Date.now();
      const durationSec = Math.round((endTime - startTime) / 1000);
      console.log("🎥 Recorded clip duration (approx):", durationSec, "s");

      setVideoUri(data?.uri || null);

      setIsRecording(false);
      setIsTimerRunning(false);
      recordingStartRef.current = null;
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
    }
  };

  const handleRedo = () => {
    // Clearing videoUri unmounts VideoView -> preview stops
    setVideoUri(null);
    setCaption("");
    setIsRecording(false);
    setUploading(false);
    setTimer(MAX_DURATION_SECONDS);
    setIsTimerRunning(false);
    recordingStartRef.current = null;
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setVideoUri(null);
    setCaption("");
    navigation.navigate("HomeTabRoot");
  };

  const handlePickVideo = async () => {
    try {
      if (uploading || isRecording) return;

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        return Alert.alert(
          "Access needed",
          "Please enable photo library access so you can pick a video.",
          [
            {
              text: "OK",
            },
          ]
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
      const pickedDuration = Math.round(asset?.duration ?? 0);

      if (!pickedUri) {
        return handleError("Couldn't read that video. Please try another one.");
      }

      if (pickedDuration && pickedDuration > MAX_DURATION_SECONDS) {
        return Alert.alert(
          "Trim required",
          "Videos must be 2 minutes or shorter. Trim the video and try again.",
          [{ text: "OK" }]
        );
      }

      setVideoUri(pickedUri);
      setCaption("");
    } catch (e) {
      console.log("Error picking video:", e);
      handleError("Error selecting a video from your library.");
    }
  };

  const handleSend = async () => {
    // Close keyboard if it's open
    Keyboard.dismiss();

    if (!videoUri || uploading) return;

    const senderID = state?.user?.id || null;

    if (!senderID) {
      return handleError("Missing user id for this post.");
    }

    try {
      setUploading(true);

      const fileForUpload = new ReactNativeFile({
        uri: videoUri,
        type: "video/mp4",
        name: "post-video.mp4",
      });

      const { sendPost } = await client.request(SEND_POST_MUTATION, {
        file: fileForUpload,
        senderID,
        text: caption?.trim?.() || null,
      });

      if (!sendPost) {
        throw new Error("We couldn't save your post. Please try again.");
      } else {
        Toast.show({
          type: "success",
          text1: "Post Sent",
          text2: "This post will soon be in the community.",
          position: "top",
          autoHide: true,
          visibilityTime: 6000,
          topOffset: 80,
        });
      }

      // Clear state and navigate away
      setVideoUri(null);
      setCaption("");

      navigation.navigate("HomeTabRoot");
    } catch (err) {
      console.log("Error in handleSend:", err);
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

  // ----- Preview mode (video captured) -----
  if (videoUri) {
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

          {/* Video preview - only render when focused so it can't keep playing in background */}
          {isFocused && (
            <VideoView
              style={styles.fullScreenVideo}
              player={player}
              contentFit="contain"
              nativeControls
            />
          )}

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
              <View style={styles.dot} />
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

        {/* Bottom center: RecordButton */}
        <View style={styles.bottomControls}>
          {isCameraReady && isFocused && (
            <>
              <TouchableOpacity
                style={styles.libraryButton}
                onPress={handlePickVideo}
                disabled={uploading || isRecording}
              >
                <Feather
                  name="folder"
                  size={22}
                  color={uploading || isRecording ? "#9ca3af" : "#f9fafb"}
                />
                <Text
                  style={[
                    styles.libraryText,
                    uploading || isRecording ? styles.libraryTextDisabled : null,
                  ]}
                >
                  Upload
                </Text>
              </TouchableOpacity>

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
  libraryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginBottom: 12,
  },
  libraryText: {
    color: "#f9fafb",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 14,
  },
  libraryTextDisabled: {
    color: "#9ca3af",
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
