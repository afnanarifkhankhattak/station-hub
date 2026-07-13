import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../../src/config"; // adjust relative path as needed

export default function BookingConfirmedScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{ booking_id?: string }>();

  const [booking, setBooking] = useState<any>(null);
  const [station, setStation] = useState<any>(null);
  const [serviceName, setServiceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      if (!params.booking_id) {
        setError("No booking found");
        setLoading(false);
        return;
      }

      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setError("Please log in to view this booking");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/bookings/${params.booking_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || "Failed to load booking");
          setLoading(false);
          return;
        }

        const bk = data.booking;
        setBooking(bk);

        // fetch station details
        if (bk.station_id) {
          const stRes = await fetch(`${API_BASE}/stations/${bk.station_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (stRes.ok) {
            const stData = await stRes.json();
            setStation(stData.station);
          }
        }

        // fetch service name (owner-only endpoint, so this may fail for non-owners — handled gracefully)
        if (bk.service_id) {
          try {
            const svcRes = await fetch(`${API_BASE}/services/public`);
            if (svcRes.ok) {
              const svcData = await svcRes.json();
              const match = (svcData.services || []).find(
                (s: any) => s.id === bk.service_id,
              );
              if (match) setServiceName(match.name);
            }
          } catch {
            // ignore, non-critical
          }
        }
      } catch (e) {
        setError("Cannot connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [params.booking_id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: styles.container.backgroundColor }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Booking Confirmed</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* TITLE */}
      <Text style={styles.title}>Booking Confirmed!</Text>
      <Text style={styles.subtitle}>
        Your service has been booked successfully
      </Text>

      {/* IMAGE */}
      <Image
        source={require("../../../assets/images/confirm.png")}
        style={styles.image}
      />

      {/* LOADING / ERROR */}
      {loading && (
        <View style={{ paddingVertical: 30, alignItems: "center" }}>
          <ActivityIndicator color="#FF7A00" size="large" />
        </View>
      )}

      {!loading && error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* CARD */}
      {!loading && !error && booking && (
        <View style={styles.card}>
          <Text style={styles.shopName}>{station?.name || "Station"}</Text>

          {(station?.address || station?.city) && (
            <View style={styles.row}>
              <Ionicons name="location-outline" size={14} />
              <Text>
                {[station?.address, station?.city].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          {serviceName ? (
            <View style={styles.row}>
              <MaterialIcons name="miscellaneous-services" size={14} />
              <Text>{serviceName}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={14} />
            <Text>{booking.travel_date}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="time-outline" size={14} />
            <Text>{booking.travel_time}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="car-outline" size={14} />
            <Text>
              {booking.vehicle_type} • {booking.vehicle_brand} •{" "}
              {booking.vehicle_number}
            </Text>
          </View>

          {booking.special_request ? (
            <View style={styles.row}>
              <Ionicons name="document-text-outline" size={14} />
              <Text>{booking.special_request}</Text>
            </View>
          ) : null}

          <View style={[styles.row, { marginTop: 10 }]}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{booking.status}</Text>
            </View>
          </View>
        </View>
      )}

      {/* HOME BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(tabs)/Home/home" as any)}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Back To Home</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffdfb", // base background (Favorites style feel)
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
    marginTop: 40,
  },

  headerTitle: { fontSize: 16, fontWeight: "700" },

  profileImage: { width: 35, height: 35, borderRadius: 8 },

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 80,
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginTop: 5,
  },

  image: {
    width: 200,
    height: 150,
    alignSelf: "center",
    marginTop: 20,
  },

  card: {
    margin: 18,
    padding: 15,
    backgroundColor: "#fff6f0", // light peach card (Favorites style match)
    borderRadius: 10,
  },

  shopName: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  errorText: {
    textAlign: "center",
    color: "#e74c3c",
    marginTop: 20,
    marginHorizontal: 18,
    fontWeight: "600",
  },

  statusBadge: {
    backgroundColor: "#FFE8D8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF7A00",
    textTransform: "capitalize",
  },

  button: {
    backgroundColor: "#FF7A00",
    margin: 18,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
});
