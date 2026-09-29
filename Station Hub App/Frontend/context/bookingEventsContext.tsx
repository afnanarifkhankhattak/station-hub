import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import { API_BASE } from "../src/config";
import { registerPushToken } from "../src/notifications";

// expo-notifications' remote-push features were removed from Expo Go in SDK 53.
// Skip loading/using it entirely when running inside Expo Go to avoid a crash.
const isExpoGo = Constants.appOwnership === "expo";

let Notifications: typeof import("expo-notifications") | null = null;
if (!isExpoGo) {
  Notifications = require("expo-notifications");
}

export type BookingStatusEvent = {
  type: "booking_status_change";
  event_id: string;
  booking_id: string;
  new_status: string;
  timestamp: string;
  message: string;
};

type BookingEventsContextValue = { latestEvent: BookingStatusEvent | null };
const BookingEventsContext = createContext<BookingEventsContextValue>({ latestEvent: null });
const DEDUPE_KEY = "handled_booking_status_events";

function websocketUrl(token: string) {
  const base = API_BASE.replace(/^http/, "ws").replace(/\/$/, "");
  return `${base}/booking-events?token=${encodeURIComponent(token)}`;
}

export function BookingEventsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [latestEvent, setLatestEvent] = useState<BookingStatusEvent | null>(null);
  const [visibleEvent, setVisibleEvent] = useState<BookingStatusEvent | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const retryDelay = useRef(1000);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(AppState.currentState === "active");

  const openBooking = (bookingId: string) => {
    setVisibleEvent(null);
    router.push({ pathname: "/(tabs)/Booking/bookingconfirm", params: { booking_id: bookingId } });
  };

  const handleEvent = async (event: BookingStatusEvent, showModal: boolean) => {
    if (!event?.booking_id || !event?.event_id) return;
    const stored = JSON.parse((await AsyncStorage.getItem(DEDUPE_KEY)) || "[]") as string[];
    if (stored.includes(event.event_id)) return;
    await AsyncStorage.setItem(DEDUPE_KEY, JSON.stringify([...stored, event.event_id].slice(-100)));
    setLatestEvent(event);
    if (showModal) setVisibleEvent(event);
  };

  useEffect(() => {
    let disposed = false;
    const scheduleConnect = (delay: number) => {
      if (disposed) return;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(connect, delay);
    };
    const connect = async () => {
      if (disposed || socket.current?.readyState === WebSocket.OPEN) return;
      const token = await AsyncStorage.getItem("token");
      if (!token) return scheduleConnect(5000);
      const ws = new WebSocket(websocketUrl(token));
      socket.current = ws;
      ws.onopen = () => { retryDelay.current = 1000; };
      ws.onmessage = ({ data }) => {
        try { handleEvent(JSON.parse(data), active.current); } catch { /* ignore malformed events */ }
      };
      ws.onclose = () => {
        if (socket.current === ws) socket.current = null;
        scheduleConnect(retryDelay.current);
        retryDelay.current = Math.min(retryDelay.current * 2, 30000);
      };
      ws.onerror = () => ws.close();
    };

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      active.current = nextState === "active";
      if (active.current) connect();
    });

    // --- Notification listeners: skipped entirely in Expo Go ---
    let notificationSubscription: { remove: () => void } | null = null;
    let foregroundNotificationSubscription: { remove: () => void } | null = null;

    if (!isExpoGo && Notifications) {
      notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const bookingId = response.notification.request.content.data?.booking_id;
        if (typeof bookingId === "string") openBooking(bookingId);
      });
      foregroundNotificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data;
        const bookingId = data?.booking_id;
        const newStatus = data?.new_status;
        if (typeof bookingId === "string" && typeof newStatus === "string") {
          handleEvent({
            type: "booking_status_change",
            event_id: `${bookingId}:${newStatus}:${data?.timestamp || notification.date}`,
            booking_id: bookingId,
            new_status: newStatus,
            timestamp: String(data?.timestamp || notification.date),
            message: notification.request.content.title || "Booking updated",
          }, active.current);
        }
      });

      Notifications.getLastNotificationResponseAsync().then((response) => {
        const bookingId = response?.notification.request.content.data?.booking_id;
        if (typeof bookingId === "string") openBooking(bookingId);
      });

      registerPushToken();
    }
    // --- end notification listeners ---

    connect();
    return () => {
      disposed = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      socket.current?.close();
      appStateSubscription.remove();
      notificationSubscription?.remove();
      foregroundNotificationSubscription?.remove();
    };
  }, []);

  const rejected = visibleEvent?.new_status === "rejected" || visibleEvent?.new_status === "cancelled";
  return (
    <BookingEventsContext.Provider value={{ latestEvent }}>
      {children}
      <Modal visible={!!visibleEvent} transparent animationType="fade" onRequestClose={() => setVisibleEvent(null)}>
        <View style={styles.backdrop} accessible accessibilityViewIsModal accessibilityLabel="Booking status update">
          <View style={styles.card} accessibilityRole="alert">
            <Ionicons name={rejected ? "alert-circle" : "checkmark-circle"} size={42} color={rejected ? "#C62828" : "#16803C"} />
            <Text style={styles.title}>{visibleEvent?.message}</Text>
            <Text style={styles.message}>Your booking status has been updated.</Text>
            <View style={styles.actions}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Dismiss booking update" onPress={() => setVisibleEvent(null)} style={styles.dismiss}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="View updated booking" onPress={() => visibleEvent && openBooking(visibleEvent.booking_id)} style={styles.view}>
                <Text style={styles.viewText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </BookingEventsContext.Provider>
  );
}

export const useBookingEvents = () => useContext(BookingEventsContext);
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 380, backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center" },
  title: { marginTop: 12, fontSize: 20, fontWeight: "700", color: "#1F2937" },
  message: { marginTop: 8, textAlign: "center", color: "#4B5563" },
  actions: { flexDirection: "row", gap: 12, marginTop: 24 },
  dismiss: { paddingVertical: 10, paddingHorizontal: 18 },
  dismissText: { color: "#4B5563", fontWeight: "600" },
  view: { borderRadius: 8, backgroundColor: "#FF7A00", paddingVertical: 10, paddingHorizontal: 22 },
  viewText: { color: "#fff", fontWeight: "700" },
});
