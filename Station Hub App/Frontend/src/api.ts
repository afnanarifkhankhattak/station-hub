import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { API_BASE } from "./config";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function handleUnauthorized() {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("refresh_token");
  router.replace("/login"); 
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let url = path;
  if (!path.startsWith("http")) {
    url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  }

  const token = await AsyncStorage.getItem("token");

  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Ensure content-type is set if it's not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
     headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const refreshToken = await AsyncStorage.getItem("refresh_token");
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
                const retriedRes = await fetch(url, { ...options, headers: newHeaders });
                resolve(retriedRes);
              } catch (err) {
                reject(err);
              }
            } else {
              resolve(res);
            }
          },
          reject: (err) => {
            reject(err);
          },
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
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("refresh_token", data.refresh_token);
        
        // update header and retry
        const newHeaders = new Headers(options.headers || {});
        newHeaders.set("Authorization", `Bearer ${data.token}`);
        if (options.body && !(options.body instanceof FormData) && !newHeaders.has("Content-Type")) {
           newHeaders.set("Content-Type", "application/json");
        }
        
        processQueue(null, data.token);
        
        return await fetch(url, { ...options, headers: newHeaders });
      } else {
        processQueue(new Error("Refresh failed"), null);
        await handleUnauthorized();
        return res;
      }
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