import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API_BASE } from "./config";
import { apiFetch } from "./api";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Foreground updates are rendered by BookingEventsProvider so users get
    // one accessible, actionable notification instead of duplicate alerts.
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushToken() {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } catch {
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  await apiFetch(`${API_BASE}/profile/push-token`, {
    method: "PUT",
    body: JSON.stringify({ push_token: token }),
  });
}
