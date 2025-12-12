import { DeviceEventEmitter } from "react-native";

export const PAYWALL_EVENTS = {
  SHOWN: "paywall_shown",
  REQUEST_OPEN: "paywall_request_open",
};

export const emitPaywallShown = () => {
  DeviceEventEmitter.emit(PAYWALL_EVENTS.SHOWN);
};

export const emitPaywallRequest = () => {
  DeviceEventEmitter.emit(PAYWALL_EVENTS.REQUEST_OPEN);
};

export const addPaywallShowListener = (callback) => {
  const subscription = DeviceEventEmitter.addListener(
    PAYWALL_EVENTS.SHOWN,
    callback
  );

  return () => subscription.remove();
};

export const addPaywallRequestListener = (callback) => {
  const subscription = DeviceEventEmitter.addListener(
    PAYWALL_EVENTS.REQUEST_OPEN,
    callback
  );

  return () => subscription.remove();
};
