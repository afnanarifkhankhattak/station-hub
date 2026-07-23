import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../../../src/config"; // adjust relative path as needed
import { apiFetch } from "../../../../src/api";
import { useBookingEvents } from "../../../../context/bookingEventsContext";
import Bottomnav from "@/components/Bottomnav";
import { useHardwareDoubleBackToExit } from "@/hooks/useHardwareDoubleBackToExit";
import { uiGoBack } from "@/utils/uiGoBack";


const TAB_STATUS_MAP: Record<string, string[]> = {
  upcoming: ["pending", "confirmed"],
  completed: ["completed"],
  closed: ["cancelled", "rejected"],
};

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: { bg: "#FEF3C7", text: "#B45309", label: "Pending" },
  confirmed: { bg: "#D1FAE5", text: "#047857", label: "Confirmed" },
  completed: { bg: "#D1FAE5", text: "#047857", label: "Completed" },
  cancelled: { bg: "#FEE2E2", text: "#B91C1C", label: "Cancelled" },
  rejected: { bg: "#FEE2E2", text: "#B91C1C", label: "Rejected" },
};

export default function BookingHistoryScreen() {
  useHardwareDoubleBackToExit();
  const { latestEvent } = useBookingEvents();
  const [activeTab, setActiveTab] = useState("upcoming");

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError("");
      try {
        const token = await AsyncStorage.getItem("token");

        // show cached data instantly
        const cached = await AsyncStorage.getItem("cached_bookings");
        if (cached) {
          setBookings(JSON.parse(cached));
          setLoading(false); // stop spinner, show cached data
        }

        // fetch fresh in background
        const res = await apiFetch(`${API_BASE}/bookings/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setBookings(data.bookings || []);
          AsyncStorage.setItem(
            "cached_bookings",
            JSON.stringify(data.bookings || []),
          );
        } else {
          if (!cached) setError(data.detail || "Failed to load bookings");
        }
      } catch (e) {
        if (!(await AsyncStorage.getItem("cached_bookings"))) {
          setError("Cannot connect to server");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    if (!latestEvent) return;
    setBookings((previous) => {
      const updated = previous.map((booking) =>
        booking.id === latestEvent.booking_id
          ? { ...booking, status: latestEvent.new_status }
          : booking,
      );
      AsyncStorage.setItem("cached_bookings", JSON.stringify(updated));
      return updated;
    });
  }, [latestEvent]);

  const filteredData = bookings.filter((item) =>
    (TAB_STATUS_MAP[activeTab] || []).includes(item.status),
  );

  const handleCancel = (bookingId: string) => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel?", [
      { text: "No" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            const res = await apiFetch(`${API_BASE}/bookings/${bookingId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (res.ok) {
              setBookings((prev) =>
                prev.map((b) =>
                  b.id === bookingId ? { ...b, status: "cancelled" } : b,
                ),
              );
            } else {
              Alert.alert("Error", data.detail || "Failed to cancel booking");
            }
          } catch (e) {
            Alert.alert("Error", "Cannot connect to server");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#FFF4EC", "#FFFFFF"]} style={styles.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={uiGoBack}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Bookings</Text>

        {/* <Image
          source={require("../../../assets/images/johndoe.png")}
          style={styles.avatar}
        /> */}
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        {["upcoming", "completed", "closed"].map((tab) => (
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
              {tab === "upcoming"
                ? "Up-Coming"
                : tab === "completed"
                  ? "Completed"
                  : "Closed"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST */}
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {loading ? (
          <View style={{ marginTop: 60, alignItems: "center" }}>
            <ActivityIndicator color="#FF7A45" size="large" />
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{error}</Text>
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name={
                activeTab === "completed"
                  ? "checkmark-circle-outline"
                  : activeTab === "closed"
                    ? "close-circle-outline"
                    : "time-outline"
              }
              size={60}
              color="#FF7A45"
            />

            <Text style={styles.emptyTitle}>
              {activeTab === "completed"
                ? "No completed bookings yet"
                : activeTab === "closed"
                  ? "No cancelled or rejected bookings"
                  : "No upcoming bookings yet"}
            </Text>

            <Text style={styles.emptySub}>
              Your bookings will appear here once processed
            </Text>
          </View>
        ) : (
          filteredData.map((item) => {
            const statusStyle = STATUS_STYLES[item.status] || {
              bg: "#F3F4F6",
              text: "#6B7280",
              label: item.status,
            };

            return (
              <View key={item.id} style={styles.card}>
                {item.service_image ? (
                  <Image
                    source={{ uri: item.service_image }}
                    style={styles.cardImage}
                  />
                ) : (
                  <Image
                    source={require("../../../../assets/images/booking.png")}
                    style={styles.cardImage}
                  />
                )}

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.service}>
                    {item.service_name || "Service"}
                  </Text>
                  <Text style={styles.shop}>{item.station_name}</Text>

                  <View style={styles.row}>
                    <Ionicons name="car-outline" size={14} color="#6B7280" />
                    <Text style={styles.text}>
                      {item.vehicle_brand}{" "}
                      {item.vehicle_number ? `, ${item.vehicle_number}` : ""}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.text}>
                      {item.travel_date} • {item.travel_time}
                    </Text>
                  </View>

                  {item.price != null && (
                    <Text style={styles.price}>
                      Total Payment $ {item.price}
                    </Text>
                  )}

                  <View style={styles.bottomRow}>
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

                    {activeTab === "upcoming" && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => handleCancel(item.id)}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <Bottomnav />
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  bg: {
    position: "absolute",
    width: "100%",
    height: 200,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
    paddingRight: 38,
  },

  avatar: {
    width: 35,
    height: 35,
    borderRadius: 20,
  },

  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },

  tab: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  activeTab: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF7A45",
  },

  tabText: {
    color: "#6B7280",
    fontSize: 12,
  },

  activeTabText: {
    color: "#FF7A45",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },

  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },

  service: {
    fontSize: 16,
    fontWeight: "700",
  },

  shop: {
    color: "#6B7280",
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  text: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },

  price: {
    fontWeight: "700",
    marginTop: 5,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    alignItems: "center",
  },

  statusCapsule: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusCapsuleText: {
    fontSize: 10,
    fontWeight: "700",
  },

  cancelBtn: {
    borderWidth: 1,
    borderColor: "#FF7A45",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  cancelText: {
    color: "#FF7A45",
    fontSize: 10,
  },

  empty: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },

  emptySub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },
});
