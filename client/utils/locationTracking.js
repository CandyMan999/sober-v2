import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const GEOFENCE_TASK = "SM_GEOFENCE_TASK";
const MOTION_TASK = "SM_MOTION_TASK";

const GEOFENCE_RADIUS_METERS = 300;
const STILL_SPEED_M_S = 0.5;
const STILL_EVENTS_THRESHOLD = 3;
const MOTION_TIME_INTERVAL_MS = 60 * 1000;

let stillCounter = 0;
let motionPingCount = 0;

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.log("[SoberMotion] GEOFENCE_TASK error", error);
    return;
  }

  const { eventType, region } = data;

  if (eventType === Location.GeofencingEventType.Exit) {
    console.log("[SoberMotion] User exited geofence:", region?.identifier);
    await startMotionTracking();
  }
});

TaskManager.defineTask(MOTION_TASK, async ({ data, error }) => {
  if (error) {
    console.log("[SoberMotion] MOTION_TASK error", error);
    return;
  }

  const { locations } = data;
  if (!locations || !locations.length) return;

  const loc = locations[0];
  const { latitude, longitude, speed } = loc.coords;

  motionPingCount += 1;
  console.log(
    "[SoberMotion] MOTION_TASK ping #" +
      motionPingCount +
      " @ " +
      new Date(loc.timestamp).toISOString(),
    JSON.stringify(loc)
  );

  console.log(
    "[SoberMotion] MOTION_TASK location:",
    latitude,
    longitude,
    "speed:",
    speed
  );

  const isStill = typeof speed === "number" && speed < STILL_SPEED_M_S;

  if (isStill) {
    stillCounter += 1;
  } else {
    stillCounter = 0;
  }

  if (stillCounter >= STILL_EVENTS_THRESHOLD) {
    console.log("[SoberMotion] User appears stopped. Resetting geofence.");
    stillCounter = 0;

    await stopMotionTracking();
    await setGeofenceAtCurrentLocation(loc);
  }
});

export async function initSoberMotionTracking() {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") {
    console.log("[SoberMotion] Foreground location permission not granted");
    return;
  }

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== "granted") {
    console.log("[SoberMotion] Background location permission not granted");
    return;
  }

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  await setGeofenceAtCurrentLocation(loc);
}

export async function ensureSoberMotionTrackingSetup() {
  try {
    const backgroundPermission = await Location.getBackgroundPermissionsAsync();
    if (backgroundPermission.status !== "granted") {
      console.log(
        "[SoberMotion] Background permission missing, skipping geofence setup"
      );
      return;
    }

    const hasGeofence = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    if (hasGeofence) {
      console.log("[SoberMotion] Geofence already active");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    await setGeofenceAtCurrentLocation(loc);
  } catch (error) {
    console.log("[SoberMotion] Error ensuring motion tracking setup", error);
  }
}

export async function stopAllSoberLocationTracking() {
  try {
    const geofencingTasks = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    if (geofencingTasks) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }

    const motionTasks = await Location.hasStartedLocationUpdatesAsync(MOTION_TASK);
    if (motionTasks) {
      await Location.stopLocationUpdatesAsync(MOTION_TASK);
    }
  } catch (error) {
    console.log("[SoberMotion] Error stopping location tracking", error);
  }
}

async function setGeofenceAtCurrentLocation(loc) {
  let location = loc;

  if (!location) {
    location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  }

  const { latitude, longitude } = location.coords;

  console.log("[SoberMotion] Setting geofence at:", latitude, longitude);

  try {
    const already = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    if (already) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }
  } catch (error) {
    console.log("[SoberMotion] Error stopping previous geofence", error);
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
}

async function startMotionTracking() {
  const already = await Location.hasStartedLocationUpdatesAsync(MOTION_TASK);
  if (already) {
    console.log("[SoberMotion] Motion tracking already running");
    return;
  }

  console.log("[SoberMotion] Starting motion tracking…");

  await Location.startLocationUpdatesAsync(MOTION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    // Keep pings predictable at roughly every 60 seconds
    distanceInterval: 0,
    timeInterval: MOTION_TIME_INTERVAL_MS,
    showsBackgroundLocationIndicator: false,
    pausesUpdatesAutomatically: true,
  });
}

async function stopMotionTracking() {
  const already = await Location.hasStartedLocationUpdatesAsync(MOTION_TASK);
  if (!already) return;

  console.log("[SoberMotion] Stopping motion tracking…");
  await Location.stopLocationUpdatesAsync(MOTION_TASK);
}
