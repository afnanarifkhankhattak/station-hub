import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { API_BASE } from "./config";
import { apiFetch } from "./api";

// expo-notifications' remote-push features were removed from Expo Go in SDK 53.
// Skip loading/using it entirely when running inside Expo Go to avoid a crash.
const isExpoGo = Constants.appOwnership === "expo";

let Notifications: typeof import("expo-notifications") | null = null;
if (!isExpoGo) {
  const NotificationsModule = require("expo-notifications");
  Notifications = NotificationsModule;
  NotificationsModule.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function setupAndroidChannel() {
  if (!isExpoGo && Notifications && Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isExpoGo || !Notifications) return false;
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function registerPushToken(): Promise<string | null> {
  if (isExpoGo || !Notifications) return null;
  if (!Device.isDevice) return null;

  const granted = await requestNotificationPermission();
  if (!granted) return null;

  await setupAndroidChannel();

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    await apiFetch(`${API_BASE}/profile/push-token`, {
      method: "PUT",
      body: JSON.stringify({ push_token: token }),
    });

    return token;
  } catch {
    return null;
  }
}

export function setupNotificationResponseListener() {
  if (isExpoGo || !Notifications) return { remove: () => {} };

  return Notifications.addNotificationResponseReceivedListener((response) => {
  const bookingId = response.notification.request.content.data?.booking_id;
    if (typeof bookingId === "string") {
      // Navigation is handled by BookingEventsProvider
    }
  });
}

export function setupForegroundNotificationListener() {
  if (isExpoGo || !Notifications) return { remove: () => {} };

  return Notifications.addNotificationReceivedListener((_notification) => {
    // Handled by BookingEventsProvider
  });
}

export async function initializeNotifications() {
  if (isExpoGo || !Notifications) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await setupAndroidChannel();
  await registerPushToken();
}