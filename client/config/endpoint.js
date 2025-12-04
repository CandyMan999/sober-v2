// config/endpoint.js
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * *****************************************************
 * 🔥 MANUAL SWITCH — YOU CONTROL EVERYTHING
 * *****************************************************
 * Set this to TRUE when you want the app (even in development)
 * to hit Heroku.
 *
 * Set to FALSE when working locally.
 *
 * You can flip this in 2 seconds.
 */
const USE_PROD = true; // <<< CHANGE THIS TO true/false ANYTIME

/**
 * *****************************************************
 * 🚀 Define URLs
 * *****************************************************
 */

// Your Heroku server
const PROD_URL = "https://sober-motivation-26a1a1acd5e8.herokuapp.com/graphql";

// Local dev URLs depending on platform
const LOCALHOST_IOS = "http://localhost:4000/graphql";
const LOCALHOST_ANDROID = "http://10.0.2.2:4000/graphql";

// Try to detect LAN IP for real devices in Expo
function getDevServerIp() {
  const host =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (!host) return null;
  return host.split(":")[0]; // extract "192.168.x.x"
}

const DEV_LAN_IP = getDevServerIp()
  ? `http://${getDevServerIp()}:4000/graphql`
  : null;

/**
 * *****************************************************
 * 🎯 Main logic
 * *****************************************************
 */

let GRAPHQL_URI;

// 🔥 Manual override always wins
if (USE_PROD) {
  GRAPHQL_URI = PROD_URL;
} else {
  // DEV MODE
  if (Platform.OS === "ios" && !Constants.deviceName) {
    GRAPHQL_URI = LOCALHOST_IOS; // iOS simulator
  } else if (Platform.OS === "android") {
    GRAPHQL_URI = LOCALHOST_ANDROID; // Android emulator
  } else if (DEV_LAN_IP) {
    GRAPHQL_URI = DEV_LAN_IP; // physical device via LAN
  } else {
    GRAPHQL_URI = LOCALHOST_IOS; // fallback
  }
}

console.log("🔌 GRAPHQL ENDPOINT:", GRAPHQL_URI);

export { GRAPHQL_URI };
