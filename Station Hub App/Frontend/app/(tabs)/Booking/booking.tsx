import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import Bottomnav from "@/components/Bottomnav";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../../src/config"; // adjust relative path as needed
import { useUser } from "../../../context/userContext";

type Station = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  image_url?: string;
  opening?: string;
  closing?: string;
  sun_off?: boolean;
};

export default function BookingScreen() {
  const router = useRouter();
  const { user } = useUser();

  const params = useLocalSearchParams<{
    service_id?: string;
    tier?: string;
    name?: string;
    price?: string;
    duration?: string;
    image_url?: string;
    station_ids?: string;
  }>();

  const hasSelectedService = !!params.service_id;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState("Car");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // ── Stations linked to this service ─────────────────────
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null,
  );
  const [loadingStations, setLoadingStations] = useState(false);
  const [stationsError, setStationsError] = useState("");

  useEffect(() => {
    const fetchStations = async () => {
      if (!params.station_ids) return;

      let ids: string[] = [];
      try {
        ids = JSON.parse(params.station_ids);
      } catch {
        ids = [];
      }
      if (!ids.length) return;

      setLoadingStations(true);
      setStationsError("");
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setStationsError("Please log in to see available stations");
          return;
        }

        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await fetch(`${API_BASE}/stations/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) return null;
              const data = await res.json();
              return data.station as Station;
            } catch {
              return null;
            }
          }),
        );

        const valid = results.filter(Boolean) as Station[];
        setStations(valid);
        if (valid.length > 0) setSelectedStationId(valid[0].id);
      } catch (e) {
        setStationsError("Failed to load stations");
      } finally {
        setLoadingStations(false);
      }
    };

    fetchStations();
  }, [params.station_ids]);

  useEffect(() => {
    if (!selectedStationId || !selectedDate) {
      setBookedSlots([]);
      return;
    }
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await fetch(
          `${API_BASE}/bookings/slots?station_id=${selectedStationId}&date=${selectedDate}`,
        );
        const data = await res.json();
        const slots: string[] = data.booked_slots || [];
        setBookedSlots(slots);
        // auto-clear selected time if it just became unavailable
        if (selectedTime && slots.includes(selectedTime)) {
          setSelectedTime(null);
        }
      } catch {
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedStationId, selectedDate]);

  useFocusEffect(
    React.useCallback(() => {
      if (!selectedStationId || !selectedDate) return;
      // this runs every time the screen comes into focus
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          const res = await fetch(
            `${API_BASE}/bookings/slots?station_id=${selectedStationId}&date=${selectedDate}`,
          );
          const data = await res.json();
          setBookedSlots(data.booked_slots || []);
        } catch {
          setBookedSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }, [selectedStationId, selectedDate]),
  );

  // ── Generate next 14 days for the date picker ───────────
  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const dates = React.useMemo(() => {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = [];
    const today = new Date();
    for (let i = 1; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dayIndex = d.getDay(); // 0 = Sunday

      const isOff = selectedStation?.sun_off && dayIndex === 0; // ← add

      result.push({
        day: dayLabels[dayIndex],
        num: dd,
        value: `${yyyy}-${mm}-${dd}`,
        isOff, // ← add
      });
    }
    return result;
  }, [selectedStation]); // ← add selectedStation as dependency

  // const times = ["10:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"];

  // ── Submit booking ───────────────────────────────────────
  const handleConfirmBooking = async () => {
    setSubmitError("");

    if (!selectedStationId) {
      setSubmitError("Please select a station");
      return;
    }
    if (!selectedDate) {
      setSubmitError("Please select a date");
      return;
    }
    if (!selectedTime) {
      setSubmitError("Please select a time");
      return;
    }
    if (!vehicleBrand.trim()) {
      setSubmitError("Please enter vehicle brand");
      return;
    }
    if (!vehicleNumber.trim()) {
      setSubmitError("Please enter vehicle number");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setSubmitError("Please log in to confirm a booking");
        return;
      }

      const res = await fetch(`${API_BASE}/bookings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          station_id: selectedStationId,
          travel_date: selectedDate,
          travel_time: selectedTime,
          vehicle_type: vehicleType,
          vehicle_brand: vehicleBrand.trim(),
          vehicle_number: vehicleNumber.trim(),
          special_request: specialRequest.trim(),
          service_id: params.service_id || null,
          tier: params.tier || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.detail || "Failed to create booking");
        return;
      }

      // after res.ok, before router.push
      const updatedRes = await fetch(
        `${API_BASE}/bookings/slots?station_id=${selectedStationId}&date=${selectedDate}`,
      );
      const updatedData = await updatedRes.json();
      setBookedSlots(updatedData.booked_slots || []);

      router.push({
        pathname: "/(tabs)/Booking/bookingconfirm",
        params: { booking_id: data.booking?.id || "" },
      });
    } catch (e) {
      setSubmitError("Cannot connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  const generateTimeSlots = (opening: string, closing: string): string[] => {
    if (!opening || !closing) return [];
    const slots: string[] = [];
    const [openH] = opening.split(":").map(Number);
    const [closeH] = closing.split(":").map(Number);
    for (let h = openH; h < closeH; h++) {
      const hour = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? "AM" : "PM";
      slots.push(`${hour}:00 ${ampm}`);
    }
    return slots;
  };

  const times = React.useMemo(() => {
    if (!selectedStation) return [];
    return generateTimeSlots(
      selectedStation.opening || "08:00",
      selectedStation.closing || "18:00",
    );
  }, [selectedStation]);

  return (
    <LinearGradient
      colors={["#fffdfb", "#fff6f0", "#ffe8d8"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {!hasSelectedService ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#FF7A00" />
            <Text style={styles.emptyTitle}>No service selected</Text>
            <Text style={styles.emptySubtitle}>
              Go to the Services page and select a service to book.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/(tabs)/service/base")}
            >
              <Text style={styles.emptyBtnText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Book Your Wash</Text>
              <Image
                source={user?.profile_image ? { uri: user.profile_image } : require("../../../assets/images/johndoe.png")}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            </View>

            {/* SERVICE CARD */}
            <View style={styles.card}>
              <Text style={styles.eyebrow}>You're Booking</Text>

              {params.image_url ? (
                <Image
                  source={{ uri: params.image_url }}
                  style={styles.image}
                />
              ) : (
                <Image
                  source={require("../../../assets/images/riverside.png")}
                  style={styles.image}
                />
              )}

              <Text style={styles.shopName}>{params.name}</Text>

              {params.tier ? (
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>{params.tier}</Text>
                </View>
              ) : null}

              <View style={styles.serviceInfoRow}>
                {params.price ? (
                  <Text style={styles.servicePrice}>
                    PKR {Number(params.price).toLocaleString()}
                  </Text>
                ) : null}

                {params.duration ? (
                  <View style={styles.serviceInfoItem}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.serviceInfoText}>
                      {params.duration}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* STATIONS */}
            <Text style={styles.sectionTitle}>Select Station</Text>

            {loadingStations && (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator color="#FF8C42" />
              </View>
            )}

            {!loadingStations && stationsError ? (
              <Text style={styles.stationError}>{stationsError}</Text>
            ) : null}

            {!loadingStations && !stationsError && stations.length === 0 && (
              <Text style={styles.stationError}>
                No stations available for this service.
              </Text>
            )}

            {!loadingStations &&
              stations.map((station) => {
                const isActive = selectedStationId === station.id;
                const locationLabel = [station.address, station.city]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <TouchableOpacity
                    key={station.id}
                    style={[
                      styles.stationRow,
                      isActive && styles.activeStationRow,
                    ]}
                    onPress={() => setSelectedStationId(station.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.stationName,
                          isActive && { color: "#fff" },
                        ]}
                      >
                        {station.name}
                      </Text>
                      {locationLabel ? (
                        <Text
                          style={[
                            styles.stationLocation,
                            isActive && { color: "#fff" },
                          ]}
                        >
                          📍 {locationLabel}
                        </Text>
                      ) : null}
                    </View>
                    {isActive && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#fff"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

            {/* DATE */}
            <Text style={styles.sectionTitle}>Select Date</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dates.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.dateCard,
                    selectedDate === item.value && styles.activeDate,
                    item.isOff && styles.disabledDate, // ← add
                  ]}
                  onPress={() => !item.isOff && setSelectedDate(item.value)} // ← add guard
                  disabled={item.isOff} // ← add
                >
                  <Text
                    style={{
                      color:
                        selectedDate === item.value
                          ? "#fff"
                          : item.isOff
                            ? "#bbb"
                            : "#000",
                    }}
                  >
                    {item.day}
                  </Text>
                  <Text
                    style={{
                      color:
                        selectedDate === item.value
                          ? "#fff"
                          : item.isOff
                            ? "#bbb"
                            : "#000",
                    }}
                  >
                    {item.num}
                  </Text>
                  {item.isOff && (
                    <Text style={{ fontSize: 9, color: "#bbb" }}>Off</Text> // ← add
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* TIME */}
            <Text style={styles.sectionTitle}>Select Time</Text>

            {loadingSlots ? (
              <ActivityIndicator
                color="#FF8C42"
                style={{ marginLeft: 18, marginTop: 8 }}
              />
            ) : (
              <View style={styles.timeContainer}>
                {times.map((time) => {
                  const isBooked = bookedSlots.includes(time);
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeBtn,
                        isSelected && styles.activeTime,
                        isBooked && styles.disabledTime,
                      ]}
                      onPress={() => !isBooked && setSelectedTime(time)}
                      disabled={isBooked}
                    >
                      <Text
                        style={{
                          color: isBooked
                            ? "#bbb"
                            : isSelected
                              ? "#fff"
                              : "#000",
                        }}
                      >
                        {time}
                      </Text>
                      {isBooked && (
                        <Text
                          style={{ fontSize: 9, color: "#bbb", marginTop: 2 }}
                        >
                          Booked
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* VEHICLE */}
            <Text style={styles.sectionTitle}>Vehicle Type</Text>

            <View style={styles.vehicleTabs}>
              <TouchableOpacity
                style={[
                  styles.vehicleTab,
                  vehicleType === "Car" && styles.activeVehicleTab,
                ]}
                onPress={() => setVehicleType("Car")}
              >
                <Text
                  style={
                    vehicleType === "Car"
                      ? styles.activeVehicleText
                      : styles.vehicleText
                  }
                >
                  Car
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.vehicleTab,
                  vehicleType === "Motorbike" && styles.activeVehicleTab,
                ]}
                onPress={() => setVehicleType("Motorbike")}
              >
                <Text
                  style={
                    vehicleType === "Motorbike"
                      ? styles.activeVehicleText
                      : styles.vehicleText
                  }
                >
                  Motorbike
                </Text>
              </TouchableOpacity>
            </View>

            {/* INPUTS */}
            <View style={styles.inputRow}>
              <TextInput
                placeholder="Vehicle Brand"
                style={styles.input}
                value={vehicleBrand}
                onChangeText={setVehicleBrand}
              />
              <TextInput
                placeholder="Vehicle Number"
                style={styles.input}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
              />
            </View>

            {/* SPECIAL REQUEST */}
            <Text style={styles.sectionTitle}>Special Request</Text>
            <View style={styles.textAreaWrap}>
              <TextInput
                placeholder="Any special instructions? (optional)"
                style={styles.textArea}
                value={specialRequest}
                onChangeText={setSpecialRequest}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* SUMMARY CARD */}
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service</Text>
                <Text style={styles.summaryValue}>{params.name || "—"}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Station</Text>
                <Text style={styles.summaryValue}>
                  {selectedStation?.name || "—"}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{selectedDate || "—"}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>{selectedTime || "—"}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vehicle</Text>
                <Text style={styles.summaryValue}>
                  {vehicleType}
                  {vehicleBrand ? ` • ${vehicleBrand}` : ""}
                  {vehicleNumber ? ` • ${vehicleNumber}` : ""}
                </Text>
              </View>
              {specialRequest ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Note</Text>
                  <Text style={styles.summaryValue}>{specialRequest}</Text>
                </View>
              ) : null}
              {params.price ? (
                <View style={[styles.summaryRow, { marginTop: 4 }]}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryTotal}>
                    PKR {Number(params.price).toLocaleString()}
                  </Text>
                </View>
              ) : null}
            </View>

            {submitError ? (
              <Text style={styles.submitError}>{submitError}</Text>
            ) : null}

            {/* CONFIRM */}
            <TouchableOpacity
              style={[styles.confirmBtn, submitting && { opacity: 0.7 }]}
              onPress={handleConfirmBooking}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}

        <Bottomnav />
      </SafeAreaView>
    </LinearGradient>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 28,
    paddingHorizontal: 18,
  },

  headerTitle: { fontSize: 22, fontWeight: "700", color: "#000" },

  profileImage: { width: 40, height: 40, borderRadius: 20 },

  card: {
    marginBottom: 5,
    marginHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,

    // Android shadow
    elevation: 5,
  },

  image: { width: "100%", height: 160, borderRadius: 15 },

  shopName: { fontSize: 18, fontWeight: "700", marginTop: 10 },

  location: { color: "#666", marginTop: 5 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 18,
    marginTop: 15,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF8C42",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 10,
  },

  tierBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFE8D8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },

  tierBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF7A00",
    textTransform: "capitalize",
  },

  serviceInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 14,
  },

  serviceInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  serviceInfoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },

  servicePrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF7A00",
  },

  textAreaWrap: {
    marginHorizontal: 18,
    marginTop: 10,
  },

  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    backgroundColor: "#fff",
    fontSize: 14,
  },

  summaryCard: {
    marginHorizontal: 18,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 14,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  summaryLabel: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
  },

  summaryValue: {
    fontSize: 13,
    color: "#000",
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },

  summaryTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF7A00",
  },

  submitError: {
    marginHorizontal: 18,
    marginTop: 10,
    fontSize: 13,
    color: "#e74c3c",
    fontWeight: "600",
  },

  stationError: {
    marginHorizontal: 18,
    marginTop: 8,
    fontSize: 13,
    color: "#888",
  },

  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 18,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  activeStationRow: {
    backgroundColor: "#FF7A00",
    borderColor: "#FF7A00",
  },

  stationName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },

  stationLocation: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  dateCard: {
    width: 60,
    height: 70,
    marginLeft: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
    borderRadius: 10,
  },

  activeDate: { backgroundColor: "#FF7A00" },

  timeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 18,
  },

  timeBtn: {
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
  },

  activeTime: {
    backgroundColor: "#FF7A00",
    borderColor: "#FF7A00",
  },

  vehicleTabs: {
    flexDirection: "row",
    padding: 18,
  },

  vehicleTab: {
    padding: 10,
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: "#eee",
  },

  activeVehicleTab: {
    backgroundColor: "#FF7A00",
  },

  vehicleText: { color: "#000" },

  activeVehicleText: { color: "#fff" },

  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },

  input: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },

  confirmBtn: {
    backgroundColor: "rgb(255, 122, 0)",
    margin: 18,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    color: "#000",
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },

  emptyBtn: {
    backgroundColor: "#FF7A00",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },

  emptyBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  confirmText: { color: "#fff", fontWeight: "700" },

  disabledTime: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  disabledDate: {
    backgroundColor: "#f0f0f0",
    borderColor: "#e0e0e0",
    opacity: 0.5,
  },
});
