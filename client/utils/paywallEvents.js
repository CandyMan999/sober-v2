import { DeviceEventEmitter } from "react-native";

export const PAYWALL_EVENTS = {
  SHOWN: "paywall_shown",
};

export const emitPaywallShown = () => {
  DeviceEventEmitter.emit(PAYWALL_EVENTS.SHOWN);
};

export const addPaywallShowListener = (callback) => {
  const subscription = DeviceEventEmitter.addListener(
    PAYWALL_EVENTS.SHOWN,
    callback
  );

  return () => subscription.remove();
};
