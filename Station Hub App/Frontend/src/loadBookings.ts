import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./config";
import { apiFetch } from "./api";

const CACHE_KEY = "cached_bookings";

/** Load bookings. Calls onCache with cached list (if any) before network. */
export async function loadBookings(
  onCache?: (bookings: any[]) => void,
): Promise<{ bookings: any[]; error: string }> {
  const token = await AsyncStorage.getItem("token");
  let cached: any[] | null = null;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      cached = JSON.parse(raw);
      onCache?.(cached);
    }
  } catch {
    /* ignore bad cache */
  }

  try {
    const res = await apiFetch(`${API_BASE}/bookings/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      const bookings = data.bookings || [];
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(bookings));
      return { bookings, error: "" };
    }
    return {
      bookings: cached || [],
      error: cached ? "" : data.detail || "Failed to load bookings",
    };
  } catch {
    return {
      bookings: cached || [],
      error: cached ? "" : "Cannot connect to server",
    };
  }
}

export async function writeBookingsCache(bookings: any[]) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(bookings));
}
