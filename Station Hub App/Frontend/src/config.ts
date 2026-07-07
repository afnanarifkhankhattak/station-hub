// src/config.ts
import { Platform } from "react-native";

// Use 10.0.2.2 for Android emulator (maps to host's localhost)
// Use localhost for iOS simulator and web
// Use your machine's real LAN IP for physical devices on the same network
// src/config.ts
const getBaseUrl = () => {
  if (__DEV__) {
    return "http://192.168.18.122:8000";
  }
  return "http://192.168.18.122:8000";
};

export const API_BASE = getBaseUrl();