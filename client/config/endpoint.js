// config/endpoint.js
import Constants from "expo-constants";
import { Platform } from "react-native";

// --- Helper: Detect Expo server IP (your Mac's LAN IP) ---
function getDevServerIp() {
  const host =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;
  // host usually looks like "192.168.0.17:19000"
  if (!host) return null;
  return host.split(":")[0]; // Extract IP
}

// Optional helper to more reliably detect Android emulator
function emulatorCheck() {
  return (
    Constants.deviceName?.includes("emulator") ||
    Constants.deviceName?.includes("Android SDK")
  );
}

const devIp = getDevServerIp();

let GRAPHQL_URI;

if (__DEV__) {
  // --- DEVELOPMENT ---
  // Case 1: iOS Simulator
  if (Platform.OS === "ios" && !Constants.deviceName) {
    GRAPHQL_URI = "http://localhost:4000/graphql";
  }
  // Case 2: Android Emulator
  else if (Platform.OS === "android" && emulatorCheck()) {
    GRAPHQL_URI = "http://10.0.2.2:4000/graphql";
  }
  // Case 3: Real device — use LAN IP
  else {
    GRAPHQL_URI = devIp
      ? `http://${devIp}:4000/graphql`
      : "http://192.168.0.17:4000/graphql"; // fallback
  }
} else {
  // --- PRODUCTION ---
  GRAPHQL_URI = "https://sober-motivation.herokuapp.com/graphql";
}

console.log("🔥 GRAPHQL_URI (from endpoint config):", GRAPHQL_URI);

export { GRAPHQL_URI };
