import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { API_BASE } from "./config";

// In-memory tokens — avoid AsyncStorage on every request.
let memToken: string | null | undefined;
let memRefresh: string | null | undefined;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

export async function setAuthTokens(token: string, refreshToken: string) {
  memToken = token;
  memRefresh = refreshToken;
  await AsyncStorage.setItem("token", token);
  await AsyncStorage.setItem("refresh_token", refreshToken);
}

export async function clearAuthTokens() {
  memToken = null;
  memRefresh = null;
  await AsyncStorage.multiRemove(["token", "refresh_token"]);
}

async function getToken(): Promise<string | null> {
  if (memToken !== undefined) return memToken;
  memToken = await AsyncStorage.getItem("token");
  return memToken;
}

async function getRefreshToken(): Promise<string | null> {
  if (memRefresh !== undefined) return memRefresh;
  memRefresh = await AsyncStorage.getItem("refresh_token");
  return memRefresh;
}

async function handleUnauthorized() {
  await clearAuthTokens();
  router.replace("/login");
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let url = path;
  if (!path.startsWith("http")) {
    url = `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
  }

  const token = await getToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await handleUnauthorized();
      return res;
    }

    if (isRefreshing) {
      return new Promise<Response>((resolve, reject) => {
        failedQueue.push({
          resolve: async (newToken) => {
            if (newToken) {
              const newHeaders = new Headers(options.headers || {});
              newHeaders.set("Authorization", `Bearer ${newToken}`);
              if (options.body && !(options.body instanceof FormData) && !newHeaders.has("Content-Type")) {
                newHeaders.set("Content-Type", "application/json");
              }
              try {
                resolve(await fetch(url, { ...options, headers: newHeaders }));
              } catch (err) {
                reject(err);
              }
            } else {
              resolve(res);
            }
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        await setAuthTokens(data.token, data.refresh_token);

        const newHeaders = new Headers(options.headers || {});
        newHeaders.set("Authorization", `Bearer ${data.token}`);
        if (options.body && !(options.body instanceof FormData) && !newHeaders.has("Content-Type")) {
          newHeaders.set("Content-Type", "application/json");
        }
        processQueue(null, data.token);
        return await fetch(url, { ...options, headers: newHeaders });
      }
      processQueue(new Error("Refresh failed"), null);
      await handleUnauthorized();
      return res;
    } catch (err) {
      processQueue(err as Error, null);
      await handleUnauthorized();
      return res;
    } finally {
      isRefreshing = false;
    }
  }

  return res;
}
