// utils/deviceCapabilities.js
import * as Device from "expo-device";

export const isIOSLiquidGlassCapable = () => {
  // Must be a physical iOS device or iOS simulator
  if (Device.osName !== "iOS") return false;

  const versionString = Device.osVersion; // e.g. "26.0.1"
  if (!versionString) return false;

  const major = parseInt(versionString.split(".")[0], 10);
  if (Number.isNaN(major)) return false;

  return major >= 26; // Liquid Glass starts at iOS 26
};
