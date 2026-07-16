import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  console.log("registerPushToken called");
  if (!Device.isDevice) return;
  console.log("is device ok");

  const { status: existing } = await Notifications.getPermissionsAsync();
  console.log("existing permission:", existing);
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  console.log("final status:", finalStatus);
  if (finalStatus !== "granted") return;

  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: "522bedc3-8641-4434-8e7f-2e0551bb2a4d",
    })).data;
    console.log("Push token:", token);
  } catch (e) {
    console.log("Token error:", e);
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) return;

  await apiFetch(`${API_BASE}/profile/push-token`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ push_token: token }),
  });
}
