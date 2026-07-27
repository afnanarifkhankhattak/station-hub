import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./config";
import { apiFetch } from "./api";

const CACHE_KEY = "cached_bookings";
// ponytail: 45s TTL; lower if live booking status feels stale without WS
const TTL_MS = 45_000;

let memBookings: any[] | null = null;
let memAt = 0;

/** Load bookings. Serves cache instantly; network only if TTL expired. */
export async function loadBookings(
  onCache?: (bookings: any[]) => void,
  opts?: { force?: boolean },
): Promise<{ bookings: any[]; error: string }> {
  const now = Date.now();
  if (!opts?.force && memBookings && memAt && now - memAt < TTL_MS) {
    onCache?.(memBookings);
    return { bookings: memBookings, error: "" };
  }

  let cached: any[] | null = memBookings;
  if (!cached) {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        cached = JSON.parse(raw);
        memBookings = cached;
        onCache?.(cached!);
      }
    } catch {
      /* ignore bad cache */
    }
  } else {
    onCache?.(cached);
  }

  try {
    const res = await apiFetch(`${API_BASE}/bookings/`);
    const data = await res.json();
    if (res.ok) {
      const bookings = data.bookings || [];
      memBookings = bookings;
      memAt = Date.now();
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(bookings));
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
  memBookings = bookings;
  memAt = Date.now();
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(bookings));
}

export function clearBookingsCache() {
  memBookings = null;
  memAt = 0;
}
