// src/config.ts
import Constants from "expo-constants";
import { Platform } from "react-native";

const BACKEND_PORT = process.env.EXPO_PUBLIC_API_PORT || "8000";
const FORCED_API_URL = process.env.EXPO_PUBLIC_API_URL;

const getBaseUrl = () => {
  if (FORCED_API_URL) return FORCED_API_URL;

  if (__DEV__ && Platform.OS === "android" && !Constants.expoConfig?.hostUri) {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  const hostUri =
    Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:${BACKEND_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
};

export const API_BASE = getBaseUrl();