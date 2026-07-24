import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { uiGoBack } from "@/utils/uiGoBack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../../src/config";
import { apiFetch } from "../../../src/api";
import { loadBookings, writeBookingsCache } from "../../../src/loadBookings";


const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string; icon: any; accent: string }
> = {
  confirmed: {
    bg: "#D1FAE5",
    text: "#047857",
    label: "Confirmed",
    icon: "checkmark-circle",
    accent: "#10B981",
  },
  completed: {
    bg: "#DBEAFE",
    text: "#1D4ED8",
    label: "Completed",
    icon: "checkmark-done-circle",
    accent: "#3B82F6",
  },
  cancelled: {
    bg: "#FEE2E2",
    text: "#B91C1C",
    label: "Cancelled",
    icon: "close-circle",
    accent: "#EF4444",
  },
  rejected: {
    bg: "#FEE2E2",
    text: "#B91C1C",
    label: "Rejected",
    icon: "close-circle",
    accent: "#EF4444",
  },
};

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState("unread");

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    setError("");
    const { bookings: next, error: err } = await loadBookings((cached) => {
      setBookings(cached);
      setLoading(false);
    });
    setBookings(next);
    setError(err);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Only status changes the customer hasn't acted on yet count as notifications —
  // a booking still sitting at "pending" hasn't changed since they created it.
  const notifications = bookings.filter((b) => b.status !== "pending");

  const unread = notifications.filter((n) => !n.customer_read);
  const read = notifications.filter((n) => n.customer_read);

  const visible = activeTab === "unread" ? unread : read;

  const handleMarkRead = async (bookingId: string) => {
    setBookings((prev) => {
      const updated = prev.map((b) =>
        b.id === bookingId ? { ...b, customer_read: true } : b,
      );
      writeBookingsCache(updated);
      return updated;
    });

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await apiFetch(`${API_BASE}/bookings/${bookingId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setBookings((prev) => {
          const reverted = prev.map((b) =>
            b.id === bookingId ? { ...b, customer_read: false } : b,
          );
          writeBookingsCache(reverted);
          return reverted;
        });
      }
    } catch {
      setBookings((prev) => {
        const reverted = prev.map((b) =>
          b.id === bookingId ? { ...b, customer_read: false } : b,
        );
        writeBookingsCache(reverted);
        return reverted;
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF4EC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF4EC" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={uiGoBack}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* TABS */}
        <View style={styles.tabContainer}>
          {["unread", "read"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab === "unread" ? `Unread (${unread.length})` : "Read"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LOADING */}
        {loading && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color="#FF8C42" size="large" />
          </View>
        )}

        {/* ERROR */}
        {!loading && error && <Text style={styles.errorText}>{error}</Text>}

        {/* EMPTY */}
        {!loading && !error && visible.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={48} color="#FF8C42" />
            <Text style={styles.emptyTitle}>
              {activeTab === "unread"
                ? "No unread notifications"
                : "No read notifications yet"}
            </Text>
            <Text style={styles.emptySub}>
              Updates on your bookings will appear here
            </Text>
          </View>
        )}

        {/* LIST */}
        {!loading &&
          !error &&
          visible.map((item) => {
            const statusStyle = STATUS_STYLES[item.status] || {
              bg: "#F3F4F6",
              text: "#6B7280",
              label: item.status,
              icon: "information-circle",
              accent: "#9CA3AF",
            };

            return (
              <View key={item.id} style={styles.row}>
                <View
                  style={[
                    styles.accentBar,
                    { backgroundColor: statusStyle.accent },
                  ]}
                />

                <View style={styles.rowContent}>
                  <View style={styles.rowTop}>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {item.service_name || "Service"}
                      </Text>
                      <View style={styles.stationRow}>
                        <Ionicons
                          name="location-sharp"
                          size={11}
                          color="#999"
                        />
                        <Text style={styles.stationText} numberOfLines={1}>
                          {item.station_name || "Station"}
                        </Text>
                      </View>
                    </View>

                    {!item.customer_read && <View style={styles.unreadDot} />}
                  </View>

                  <View
                    style={[
                      styles.statusCapsule,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusCapsuleText,
                        { color: statusStyle.text },
                      ]}
                    >
                      {statusStyle.label}
                    </Text>
                  </View>

                  <View style={styles.rowBottom}>
                    <View style={styles.dateRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color="#999"
                      />
                      <Text style={styles.rowDate}>
                        {item.travel_date} • {item.travel_time}
                      </Text>
                    </View>

                    {activeTab === "unread" && (
                      <TouchableOpacity
                        style={styles.markReadBtn}
                        onPress={() => handleMarkRead(item.id)}
                      >
                        <Text style={styles.markReadText}>Mark Read</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF4EC",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 20,
  },

  backBtn: {
    width: 22,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 5,
    marginBottom: 18,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
  },

  activeTab: {
    backgroundColor: "#FF8C42",
  },

  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },

  activeTabText: {
    color: "#fff",
  },

  errorText: {
    textAlign: "center",
    color: "#e74c3c",
    marginTop: 20,
  },

  empty: {
    alignItems: "center",
    marginTop: 60,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    marginTop: 10,
  },

  emptySub: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  accentBar: {
    width: 5,
  },

  rowContent: {
    flex: 1,
    padding: 14,
  },

  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  statusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  serviceName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 3,
  },

  stationText: {
    fontSize: 12,
    color: "#999",
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#FF8C42",
    marginLeft: 8,
    marginTop: 4,
  },

  statusCapsule: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
  },

  statusCapsuleText: {
    fontSize: 11,
    fontWeight: "700",
  },

  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  rowDate: {
    fontSize: 11,
    color: "#999",
  },

  markReadBtn: {
    backgroundColor: "#FF8C42",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  markReadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});
