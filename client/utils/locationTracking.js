// utils/locationTracking.js
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { GET_LIQUOR_STORE_QUERY, GET_BAR_QUERY } from "../GraphQL/queries";
import { getToken as getStoredPushToken } from "./helpers";

const GEOFENCE_TASK = "SM_GEOFENCE_TASK";
const MOTION_TASK = "SM_MOTION_TASK";

const GEOFENCE_RADIUS_METERS = 75;

// Real 2-minute logical interval (we enforce manually)
const MOTION_TIME_INTERVAL_MS = 2 * 60 * 1000;

// Stopped logic
const STOP_DISTANCE_METERS = 20;
const STOP_PING_THRESHOLD = 3;

let graphQLRequestFn = null;
let pushTokenResolver = getStoredPushToken;
let lastNearbyBar = null;
let lastNearbyStore = null;

let motionPingCount = 0;
let lastAcceptedPingTime = 0;
let lastStopCheckLocation = null;
let consecutiveSmallMoves = 0;

// External dependencies for venue lookups
export function configureLocationTrackingClient({
  requestFn,
  getPushTokenFn,
  lastBar,
  lastStore,
} = {}) {
  if (typeof requestFn === "function") {
    graphQLRequestFn = requestFn;
  }

  if (typeof getPushTokenFn === "function") {
    pushTokenResolver = getPushTokenFn;
  }

  if (lastBar !== undefined) {
    lastNearbyBar = lastBar;
  }

  if (lastStore !== undefined) {
    lastNearbyStore = lastStore;
  }
}

export function resetVenueTrackingCache() {
  lastNearbyBar = null;
  lastNearbyStore = null;
}

// ------------------------
// GEOFENCE TASK
// ------------------------
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return console.log("[SoberMotion] GEOFENCE_TASK error", error);

  const { eventType, region } = data || {};
  const isExit = eventType === Location.GeofencingEventType.Exit;

  if (isExit) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "EXIT geofence",
          body: `Exited radius ${GEOFENCE_RADIUS_METERS}m`,
          data: { type: "geo_exit" },
        },
        trigger: null,
      });
    } catch {}

    motionPingCount = 0;
    lastAcceptedPingTime = 0;
    lastStopCheckLocation = null;
    consecutiveSmallMoves = 0;

    await startMotionTracking();
  }
});

// ------------------------
// MOTION TASK
// ------------------------
TaskManager.defineTask(MOTION_TASK, async ({ data, error }) => {
  if (error) return console.log("[SoberMotion] MOTION_TASK error", error);

  const { locations } = data || {};
  if (!locations?.length) return;

  const loc = locations[0];
  const { latitude, longitude } = loc.coords;
  const now = Date.now();

  // Enforce our own 2-minute gate
  if (
    lastAcceptedPingTime &&
    now - lastAcceptedPingTime < MOTION_TIME_INTERVAL_MS
  )
    return;

  // Accept this ping
  lastAcceptedPingTime = now;
  motionPingCount += 1;

  // Distance from previous "stop check" point
  let moveDistance = 0;
  if (lastStopCheckLocation) {
    moveDistance = distanceInMeters(
      lastStopCheckLocation.latitude,
      lastStopCheckLocation.longitude,
      latitude,
      longitude
    );
  }

  const movingStatus =
    moveDistance < STOP_DISTANCE_METERS ? "STILL-ish" : "MOVING";

  // --------------------------------
  // 🔔 Motion ping notification
  // --------------------------------
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Ping #${motionPingCount} (${movingStatus})`,
        body: `Moved ${moveDistance.toFixed(1)}m\nLat: ${latitude.toFixed(
          5
        )}, Lng: ${longitude.toFixed(5)}`,
        data: {
          type: "motion_ping",
          distanceMoved: moveDistance,
          pingNumber: motionPingCount,
        },
      },
      trigger: null,
    });
  } catch {}

  await checkNearbyVenues(latitude, longitude);

  // --------------------------------
  // STOP LOGIC
  // --------------------------------
  if (!lastStopCheckLocation) {
    lastStopCheckLocation = { latitude, longitude };
    return;
  }

  if (moveDistance < STOP_DISTANCE_METERS) {
    consecutiveSmallMoves += 1;
  } else {
    consecutiveSmallMoves = 0;
    lastStopCheckLocation = { latitude, longitude };
  }

  if (consecutiveSmallMoves >= STOP_PING_THRESHOLD) {
    consecutiveSmallMoves = 0;
    motionPingCount = 0;
    lastStopCheckLocation = null;
    lastAcceptedPingTime = 0;

    // 🔔 stopped notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Stopped moving",
          body: "Resetting geofence at new location.",
          data: { type: "stopped_moving" },
        },
        trigger: null,
      });
    } catch {}

    await stopMotionTracking();
    await setGeofenceAtCurrentLocation(loc);
  }
});

async function resolvePushToken() {
  if (typeof pushTokenResolver !== "function") return null;

  try {
    return await pushTokenResolver();
  } catch (error) {
    console.log("[SoberMotion] Unable to resolve push token", error);
    return null;
  }
}

async function checkNearbyVenues(latitude, longitude) {
  if (!graphQLRequestFn) return;

  const pushToken = await resolvePushToken();
  if (!pushToken) return;

  const baseVariables = {
    lat: latitude,
    long: longitude,
    token: pushToken,
  };

  try {
    const liquorResponse = await graphQLRequestFn(GET_LIQUOR_STORE_QUERY, {
      ...baseVariables,
      store: lastNearbyStore,
    });

    const liquorResults = liquorResponse?.getLiquorLocation;

    // ✅ Only update when we actually HAVE at least one result
    if (!!liquorResults.length) {
      lastNearbyStore = liquorResults[0].name;
    }
  } catch (error) {
    console.log("[SoberMotion] Liquor store lookup failed", error);
  }

  try {
    const barResponse = await graphQLRequestFn(GET_BAR_QUERY, {
      ...baseVariables,
      bar: lastNearbyBar,
    });

    const barResults = barResponse?.getBarLocation;

    // ✅ Only update when we actually HAVE at least one result
    if (!!barResults.length) {
      lastNearbyBar = barResults[0]?.name;
    }
  } catch (error) {
    console.log("[SoberMotion] Bar lookup failed", error);
  }
}

// ------------------------
// PUBLIC API
// ------------------------
export async function initSoberMotionTracking() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return;

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") return;

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });

  await setGeofenceAtCurrentLocation(loc);
}

export async function ensureSoberMotionTrackingSetup() {
  const bg = await Location.getBackgroundPermissionsAsync();
  if (bg.status !== "granted") return;

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });

  await setGeofenceAtCurrentLocation(loc);
}

export async function stopAllSoberLocationTracking() {
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK))
    await Location.stopGeofencingAsync(GEOFENCE_TASK);

  if (await Location.hasStartedLocationUpdatesAsync(MOTION_TASK))
    await Location.stopLocationUpdatesAsync(MOTION_TASK);
}

// ------------------------
// HELPERS
// ------------------------
async function setGeofenceAtCurrentLocation(loc) {
  if (!loc) {
    loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
  }

  const { latitude, longitude } = loc.coords;

  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }

  const regions = [
    {
      identifier: "SM_CURRENT_POSITION",
      latitude,
      longitude,
      radius: GEOFENCE_RADIUS_METERS,
      notifyOnEnter: false,
      notifyOnExit: true,
    },
  ];

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);

  // 🔔 geofence set notification
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Geofence set",
        body: `Radius ${GEOFENCE_RADIUS_METERS}m at ${latitude.toFixed(
          5
        )}, ${longitude.toFixed(5)}`,
        data: { type: "geofence_set" },
      },
      trigger: null,
    });
  } catch {}
}

async function startMotionTracking() {
  if (await Location.hasStartedLocationUpdatesAsync(MOTION_TASK)) return;

  await Location.startLocationUpdatesAsync(MOTION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation, // highest
    distanceInterval: 10, // <-- ⭐ NEW
    timeInterval: MOTION_TIME_INTERVAL_MS, // android only
    pausesUpdatesAutomatically: true,
    showsBackgroundLocationIndicator: false,
  });
}

async function stopMotionTracking() {
  if (await Location.hasStartedLocationUpdatesAsync(MOTION_TASK)) {
    await Location.stopLocationUpdatesAsync(MOTION_TASK);
  }
}

// distance helper
function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
