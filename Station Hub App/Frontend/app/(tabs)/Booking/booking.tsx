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
  Modal,
  FlatList,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import Bottomnav from "@/components/Bottomnav";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { API_BASE } from "../../../src/config";
import { useUser } from "../../../context/userContext";
import { apiFetch } from "../../../src/api";


/* ────────────────────────────────────────────────────────────
   TYPES
   ──────────────────────────────────────────────────────────── */
type Station = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  image?: string;
  image_url?: string;
  opening?: string;
  closing?: string;
  sun_off?: boolean;
  avg_rating?: number;
  rating_count?: number;
  latitude?: number;
  longitude?: number;
};

type Tier = { price: number; duration: string };

type Service = {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  tiers?: { base?: Tier; premium?: Tier };
  categories?: Record<string, { base?: Tier; premium?: Tier }>;
};

/* Business rules for price adjustment that the API does not (yet) expose.
   NOTE: these are UI-side defaults, not hardcoded station/service data —
   every price still originates from the fetched service tier. Once the
   backend exposes a per-vehicle-type price and/or a live discount field,
   swap these constants for the API values. */
type DateItem = {
  day: string;
  num: string;
  month: string;
  year: number;
  value: string;
  isOff?: boolean;
};

const MOTORBIKE_PRICE_MULTIPLIER = 0.7;
const DEFAULT_DISCOUNT_PERCENT = 20;

const SCREEN_WIDTH = Dimensions.get("window").width;

/* Very small helper: pick a representative icon for a service based on
   its (dynamically fetched) name — purely presentational, no service
   data is hardcoded. */
function getServiceIcon(name: string) {
  const n = (name || "").toLowerCase();
  if (n.includes("full")) return { lib: "FontAwesome5", icon: "briefcase" };
  if (n.includes("oil")) return { lib: "MaterialCommunityIcons", icon: "oil" };
  if (n.includes("detail")) return { lib: "Ionicons", icon: "sparkles" };
  if (n.includes("interior")) return { lib: "MaterialCommunityIcons", icon: "car-seat" };
  if (n.includes("polish") || n.includes("wax"))
    return { lib: "MaterialCommunityIcons", icon: "spray-bottle" };
  return { lib: "FontAwesome5", icon: "car" };
}

function ServiceIcon({
  name,
  color,
  size = 20,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  const { lib, icon } = getServiceIcon(name);
  if (lib === "FontAwesome5")
    return <FontAwesome5 name={icon as any} size={size} color={color} />;
  if (lib === "MaterialCommunityIcons")
    return (
      <MaterialCommunityIcons name={icon as any} size={size} color={color} />
    );
  return <Ionicons name={icon as any} size={size} color={color} />;
}

function DateCard({
  item,
  isSelected,
  onSelect,
}: {
  item: DateItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (item.isOff) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.86, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
    ]).start();
    onSelect();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.dateCard, isSelected && styles.activeDate, item.isOff && styles.disabledDate]}
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={item.isOff}
      >
        <Text style={[styles.dateCardDay, { color: isSelected ? "#fff" : item.isOff ? "#bbb" : "#888" }]}>
          {item.day}
        </Text>
        <Text style={[styles.dateCardNum, { color: isSelected ? "#fff" : item.isOff ? "#bbb" : "#000" }]}>
          {item.num}
        </Text>
        {item.isOff && <Text style={{ fontSize: 8, color: "#bbb" }}>Off</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function BookingScreen() {
  const router = useRouter();
  const { user } = useUser();

  const params = useLocalSearchParams<{
    service_id?: string;
    tier?: string;
    station_ids?: string;
  }>();

  /* ── Stations ─────────────────────────────────────────── */
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [stationsError, setStationsError] = useState("");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null,
  );
  const [selectedStationObj, setSelectedStationObj] = useState<Station | null>(null);
  const [stationModalVisible, setStationModalVisible] = useState(false);
  const [stationSearch, setStationSearch] = useState("");
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const selectedStation = selectedStationObj;

  useEffect(() => {
    const fetchStations = async () => {
      setLoadingStations(true);
      setStationsError("");
      try {
        const q = stationSearch.trim();
        const url = q 
          ? `${API_BASE}/stations/public/search?q=${encodeURIComponent(q)}` 
          : `${API_BASE}/stations/public?limit=20`;
        const res = await apiFetch(url);
        const data = await res.json();
        const list: Station[] = data.stations || [];
        setAllStations(list);

        if (list.length === 0 && !selectedStationObj) {
          setStationsError("No stations available right now.");
          return;
        }

        // Only preselect on initial load
        if (!selectedStationObj) {
          let preselectId: string | null = null;
          if (params.station_ids) {
            try {
              const ids: string[] = JSON.parse(params.station_ids);
              preselectId = ids[0] || null;
            } catch {}
          }
          
          if (preselectId) {
            const found = list.find((s) => s.id === preselectId);
            if (found) {
              setSelectedStationId(found.id);
              setSelectedStationObj(found);
            } else {
              // fetch single station
              const singleRes = await apiFetch(`${API_BASE}/stations/public/${preselectId}`);
              if (singleRes.ok) {
                const singleData = await singleRes.json();
                if (singleData.station) {
                  setSelectedStationId(singleData.station.id);
                  setSelectedStationObj(singleData.station);
                }
              }
            }
          } else if (list.length > 0) {
             setSelectedStationId(list[0].id);
             setSelectedStationObj(list[0]);
          }
        }
      } catch (e) {
        setStationsError("Failed to load stations");
      } finally {
        setLoadingStations(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchStations();
    }, 400);
    
    return () => clearTimeout(timer);
  }, [stationSearch, params.station_ids]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({});
        setUserCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {
        // silently ignore — distance is a nice-to-have
      }
    })();
  }, []);

  const distanceLabel = React.useMemo(() => {
    if (
      !userCoords ||
      !selectedStation?.latitude ||
      !selectedStation?.longitude
    )
      return null;
    const km = haversineKm(
      userCoords.latitude,
      userCoords.longitude,
      selectedStation.latitude,
      selectedStation.longitude,
    );
    return `${km.toFixed(1)} km away`;
  }, [userCoords, selectedStation]);

  /* ── Services (scoped to selected station) ───────────────── */
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (!selectedStationId) return;
    const fetchServices = async () => {
      setLoadingServices(true);
      setServicesError("");
      try {
        const res = await apiFetch(
          `${API_BASE}/services/public/station/${selectedStationId}`,
        );
        const data = await res.json();
        const list: Service[] = data.services || [];
        setServices(list);
        if (list.length === 0) {
          setSelectedServiceId(null);
          return;
        }
        const stillValid = list.some((s) => s.id === selectedServiceId);
        if (!stillValid) {
          const preselect =
            (params.service_id && list.find((s) => s.id === params.service_id)
              ?.id) ||
            list[0].id;
          setSelectedServiceId(preselect);
        }
      } catch {
        setServicesError("Failed to load services for this station");
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [selectedStationId]);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  /* ── Date / Time ──────────────────────────────────────────── */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const dates = React.useMemo(() => {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: DateItem[] = [];
    const today = new Date();
    for (let i = 0; i < 182; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dayIndex = d.getDay();
      const isOff = selectedStation?.sun_off && dayIndex === 0;
      result.push({
        day: dayLabels[dayIndex],
        num: dd,
        month: d.toLocaleString("default", { month: "long" }),
        year: yyyy,
        value: `${yyyy}-${mm}-${dd}`,
        isOff,
      });
    }
    return result;
  }, [selectedStation]);

  const dateMonths = React.useMemo(() => {
    const order: string[] = [];
    const map: Record<string, DateItem[]> = {};
    dates.forEach((d) => {
      const key = `${d.year}-${d.month}`;
      if (!map[key]) {
        map[key] = [];
        order.push(key);
      }
      map[key].push(d);
    });
    return order.map((key) => ({
      key,
      month: map[key][0].month,
      year: map[key][0].year,
      days: map[key],
    }));
  }, [dates]);

  const [monthIndex, setMonthIndex] = useState(0);
  const currentMonthGroup = dateMonths[monthIndex] || null;

  const monthLabel = currentMonthGroup
    ? `${currentMonthGroup.month} ${currentMonthGroup.year}`
    : "";

  const canGoPrevMonth = monthIndex > 0;
  const canGoNextMonth = monthIndex < dateMonths.length - 1;

  const slideX = React.useRef(new Animated.Value(0)).current;

  const animateMonthChange = (
    direction: "next" | "prev",
    applyChange: () => void,
  ) => {
    const exitTo = direction === "next" ? -SCREEN_WIDTH * 0.4 : SCREEN_WIDTH * 0.4;
    Animated.timing(slideX, { toValue: exitTo, duration: 160, useNativeDriver: true }).start(() => {
      applyChange();
      slideX.setValue(direction === "next" ? SCREEN_WIDTH * 0.4 : -SCREEN_WIDTH * 0.4);
      Animated.timing(slideX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    });
  };

  const goToPrevMonth = () => {
    if (!canGoPrevMonth) return;
    animateMonthChange("prev", () => setMonthIndex((m) => Math.max(0, m - 1)));
  };
  const goToNextMonth = () => {
    if (!canGoNextMonth) return;
    animateMonthChange("next", () =>
      setMonthIndex((m) => Math.min(dateMonths.length - 1, m + 1)),
    );
  };

  useEffect(() => {
    setMonthIndex(0);
    if (!selectedDate && dates.length) {
      const firstOpen = dates.find((d) => !d.isOff);
      if (firstOpen) setSelectedDate(firstOpen.value);
    }
  }, [dates]);

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

  const fetchSlots = React.useCallback(async () => {
    if (!selectedStationId || !selectedDate) {
      setBookedSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const res = await apiFetch(
        `${API_BASE}/bookings/slots?station_id=${selectedStationId}&date=${selectedDate}`,
      );
      const data = await res.json();
      const slots: string[] = data.booked_slots || [];
      setBookedSlots(slots);
      if (selectedTime && slots.includes(selectedTime)) {
        setSelectedTime(null);
      }
    } catch {
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedStationId, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useFocusEffect(
    React.useCallback(() => {
      fetchSlots();
    }, [fetchSlots]),
  );

  /* ── Vehicle & special request ────────────────────────────── */
  const [vehicleType, setVehicleType] = useState<"Car" | "Motorbike">("Car");
  const [carCategory, setCarCategory] = useState<string>("sedan");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

  const basePrice = React.useMemo(() => {
    if (!selectedService) return null;
    
    // If Car and categories exist for the selected category, use it
    if (vehicleType === "Car" && selectedService.categories && selectedService.categories[carCategory]?.base?.price) {
      return selectedService.categories[carCategory].base.price;
    }
    
    // Fallback to legacy general tiers
    return selectedService.tiers?.base?.price ?? null;
  }, [selectedService, vehicleType, carCategory]);

  const adjustedPrice = React.useMemo(() => {
    if (basePrice == null) return null;
    return vehicleType === "Motorbike"
      ? Math.round(basePrice * MOTORBIKE_PRICE_MULTIPLIER)
      : basePrice;
  }, [basePrice, vehicleType]);

  const discountAmount = React.useMemo(() => {
    if (adjustedPrice == null) return null;
    return Math.round((adjustedPrice * DEFAULT_DISCOUNT_PERCENT) / 100);
  }, [adjustedPrice]);

  const totalPrice = React.useMemo(() => {
    if (adjustedPrice == null || discountAmount == null) return null;
    return adjustedPrice - discountAmount;
  }, [adjustedPrice, discountAmount]);

  /* ── Submit booking ───────────────────────────────────────── */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleConfirmBooking = async () => {
    setSubmitError("");

    if (!selectedStationId) return setSubmitError("Please select a station");
    if (!selectedServiceId) return setSubmitError("Please select a service");
    if (!selectedDate) return setSubmitError("Please select a date");
    if (!selectedTime) return setSubmitError("Please select a time");
    if (!vehicleBrand.trim())
      return setSubmitError("Please enter vehicle brand");
    if (!vehicleNumber.trim())
      return setSubmitError("Please enter vehicle number");

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setSubmitError("Please log in to confirm a booking");
        return;
      }

      const res = await apiFetch(`${API_BASE}/bookings/`, {
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
          service_id: selectedServiceId,
          tier: "base",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.detail || "Failed to create booking");
        return;
      }

      await fetchSlots();

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

  /* ── Render ───────────────────────────────────────────────── */
  const filteredStations = allStations;

  return (
    <LinearGradient
      colors={["#fffdfb", "#fff6f0", "#ffe8d8"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Book Your Wash</Text>
            <Image
              source={
                user?.profile_image
                  ? { uri: user.profile_image }
                  : require("../../../assets/images/johndoe.png")
              }
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          </View>

          {/* STATION CARD */}
          {loadingStations ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color="#FF8C42" />
            </View>
          ) : stationsError ? (
            <Text style={styles.stationError}>{stationsError}</Text>
          ) : selectedStation ? (
            <View style={styles.card}>
              <Image
                source={
                  selectedStation.image || selectedStation.image_url
                    ? { uri: selectedStation.image || selectedStation.image_url }
                    : require("../../../assets/images/riverside.png")
                }
                style={styles.image}
              />

              <View style={styles.stationHeaderRow}>
                <Text style={styles.shopName}>{selectedStation.name}</Text>
                {typeof selectedStation.avg_rating === "number" && (
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={12} color="#FF7A00" />
                    <Text style={styles.ratingText}>
                      {selectedStation.avg_rating.toFixed(1)}
                    </Text>
                    {typeof selectedStation.rating_count === "number" && (
                      <Text style={styles.ratingCount}>
                        ({selectedStation.rating_count})
                      </Text>
                    )}
                  </View>
                )}
              </View>

              <Text style={styles.location}>
                📍{" "}
                {[selectedStation.address, selectedStation.city]
                  .filter(Boolean)
                  .join(", ") || "Location unavailable"}
                {distanceLabel ? ` · ${distanceLabel}` : ""}
              </Text>

              <TouchableOpacity
                style={styles.changeStationBtn}
                onPress={() => setStationModalVisible(true)}
              >
                <Text style={styles.changeStationText}>Change Station</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* SERVICES */}
          <Text style={styles.sectionTitle}>Select Service</Text>
          {loadingServices ? (
            <ActivityIndicator
              color="#FF8C42"
              style={{ marginLeft: 18, marginTop: 8 }}
            />
          ) : servicesError ? (
            <Text style={styles.stationError}>{servicesError}</Text>
          ) : services.length === 0 ? (
            <Text style={styles.stationError}>
              No services available at this station.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12 }}
            >
              {services.map((service) => {
                const isActive = selectedServiceId === service.id;
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      isActive && styles.activeServiceCard,
                    ]}
                    onPress={() => setSelectedServiceId(service.id)}
                  >
                    <ServiceIcon
                      name={service.name}
                      color={isActive ? "#fff" : "#FF7A00"}
                    />
                    <Text
                      style={[
                        styles.serviceCardText,
                        isActive && { color: "#fff" },
                      ]}
                    >
                      {service.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}



          {/* DATE */}
          <Text style={styles.sectionTitle}>Select Date</Text>

          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={goToPrevMonth}
              disabled={!canGoPrevMonth}
              style={styles.monthArrowBtn}
              hitSlop={8}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={canGoPrevMonth ? "#000" : "#ccc"}
              />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={goToNextMonth}
              disabled={!canGoNextMonth}
              style={styles.monthArrowBtn}
              hitSlop={8}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={canGoNextMonth ? "#000" : "#ccc"}
              />
            </TouchableOpacity>
          </View>

          <Animated.View
            style={{ transform: [{ translateX: slideX }] }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}
            >
              {(currentMonthGroup?.days || []).map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.dateCard,
                    selectedDate === item.value && styles.activeDate,
                    item.isOff && styles.disabledDate,
                  ]}
                  onPress={() => !item.isOff && setSelectedDate(item.value)}
                  disabled={item.isOff}
                >
                  <Text
                    style={[
                      styles.dateCardDay,
                      {
                        color:
                          selectedDate === item.value
                            ? "#fff"
                            : item.isOff
                              ? "#bbb"
                              : "#888",
                      },
                    ]}
                  >
                    {item.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateCardNum,
                      {
                        color:
                          selectedDate === item.value
                            ? "#fff"
                            : item.isOff
                              ? "#bbb"
                              : "#000",
                      },
                    ]}
                  >
                    {item.num}
                  </Text>
                  {item.isOff && (
                    <Text style={{ fontSize: 8, color: "#bbb" }}>Off</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <View style={styles.paginationRow}>
            {dateMonths.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.paginationDot,
                  i === monthIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          {/* TIME */}
          <Text style={styles.sectionTitle}>Select Time</Text>

          {loadingSlots ? (
            <ActivityIndicator
              color="#FF8C42"
              style={{ marginLeft: 18, marginTop: 8 }}
            />
          ) : times.length === 0 ? (
            <Text style={styles.stationError}>
              No time slots available for this station.
            </Text>
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
          <Text style={styles.sectionTitle}>Vehicle</Text>

          <View style={styles.radioRow}>
            {(["Car", "Motorbike"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.radioOption}
                onPress={() => setVehicleType(type)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    vehicleType === type && styles.radioOuterActive,
                  ]}
                >
                  {vehicleType === type && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* CAR CATEGORY SELECTOR */}
          {vehicleType === "Car" && (
            <View style={{ paddingHorizontal: 18, marginTop: 15 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#444" }}>Car Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
                {[
                  { id: "sedan", label: "Sedan" },
                  { id: "hatchback", label: "Hatchback" },
                  { id: "suv", label: "SUV/Crossover" },
                  { id: "microcar", label: "Microcar" },
                  { id: "pickup", label: "Pickup" },
                ].map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCarCategory(cat.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: carCategory === cat.id ? "#FF7A00" : "#f0f0f0",
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ 
                      fontSize: 12, 
                      fontWeight: "600", 
                      color: carCategory === cat.id ? "#fff" : "#444" 
                    }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

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
          <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
          <View style={styles.textAreaWrap}>
            <TextInput
              placeholder="Tell us if you have requests"
              style={styles.textArea}
              value={specialRequest}
              onChangeText={setSpecialRequest}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* PRICE SUMMARY */}
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>
                {adjustedPrice != null
                  ? `Rs ${adjustedPrice.toLocaleString()}`
                  : "—"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: "#2e9e5b" }]}>
                {discountAmount != null
                  ? `-${DEFAULT_DISCOUNT_PERCENT}%`
                  : "—"}
              </Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 4 }]}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryTotal}>
                {totalPrice != null ? `Rs ${totalPrice.toLocaleString()}` : "—"}
              </Text>
            </View>
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
              <Text style={styles.confirmText}>Confirm Booking →</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <Bottomnav />

        {/* STATION SELECTION MODAL */}
        <Modal
          visible={stationModalVisible}
          animationType="slide"
          onRequestClose={() => setStationModalVisible(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a Station</Text>
              <TouchableOpacity onPress={() => setStationModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color="#999" />
              <TextInput
                placeholder="Search stations"
                style={styles.searchInput}
                value={stationSearch}
                onChangeText={setStationSearch}
              />
            </View>

            <FlatList
              data={filteredStations}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => {
                const isActive = item.id === selectedStationId;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalStationRow,
                      isActive && styles.activeStationRow,
                    ]}
                    onPress={() => {
                      setSelectedStationId(item.id);
                      setSelectedStationObj(item);
                      setSelectedDate(null);
                      setSelectedTime(null);
                      setStationModalVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.stationName,
                          isActive && { color: "#fff" },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.stationLocation,
                          isActive && { color: "#fff" },
                        ]}
                      >
                        📍{" "}
                        {[item.address, item.city].filter(Boolean).join(", ")}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.stationError}>No stations found.</Text>
              }
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 28,
    paddingHorizontal: 18,
  },

  headerTitle: { fontSize: 20, fontWeight: "700", color: "#000" },

  card: {
    marginBottom: 5,
    marginHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },

  image: { width: "100%", height: 160, borderRadius: 15 },

  stationHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  shopName: { fontSize: 18, fontWeight: "700", flexShrink: 1 },

  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFE8D8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },

  ratingText: { fontSize: 12, fontWeight: "700", color: "#FF7A00" },
  ratingCount: { fontSize: 11, color: "#a86a2f" },

  location: { color: "#666", marginTop: 6, fontSize: 13 },

  changeStationBtn: {
    backgroundColor: "#FF7A00",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },

  changeStationText: { color: "#fff", fontWeight: "700" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 18,
    marginTop: 18,
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginTop: 18,
  },

  monthLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    minWidth: 140,
    textAlign: "center",
  },

  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 10,
  },

  monthArrowBtn: { padding: 6 },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 10,
  },

  dateCardDay: { fontSize: 11, fontWeight: "600" },
  dateCardNum: { fontSize: 15, fontWeight: "700" },

  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },

  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#e5c6a8",
  },

  paginationDotActive: {
    backgroundColor: "#FF7A00",
    width: 14,
  },

  stationError: {
    marginHorizontal: 18,
    marginTop: 8,
    fontSize: 13,
    color: "#888",
  },

  serviceCard: {
    width: 84,
    marginRight: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  activeServiceCard: {
    backgroundColor: "#FF7A00",
    borderColor: "#FF7A00",
  },

  serviceCardText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000",
    marginTop: 6,
    textAlign: "center",
  },

  dateCard: {
    width: 42,
    height: 78,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#eee",
    gap: 4,
  },

  activeDate: { backgroundColor: "#FF7A00", borderColor: "#FF7A00" },

  disabledDate: {
    backgroundColor: "#f5f5f5",
    borderColor: "#eee",
    opacity: 0.5,
  },

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

  activeTime: { backgroundColor: "#FF7A00", borderColor: "#FF7A00" },

  disabledTime: { backgroundColor: "#f5f5f5", borderColor: "#e0e0e0" },

  radioRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    marginTop: 10,
    gap: 24,
  },

  radioOption: { flexDirection: "row", alignItems: "center", gap: 8 },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterActive: { borderColor: "#FF7A00" },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF7A00",
  },

  radioLabel: { fontSize: 14, fontWeight: "600", color: "#000" },

  
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
    backgroundColor: "#fff",
  },

  textAreaWrap: { marginHorizontal: 18, marginTop: 10 },

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

  summaryLabel: { fontSize: 13, color: "#888", fontWeight: "600" },

  summaryValue: {
    fontSize: 13,
    color: "#000",
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },

  summaryTotal: { fontSize: 16, fontWeight: "800", color: "#FF7A00" },

  submitError: {
    marginHorizontal: 18,
    marginTop: 10,
    fontSize: 13,
    color: "#e74c3c",
    fontWeight: "600",
  },

  confirmBtn: {
    backgroundColor: "rgb(255, 122, 0)",
    margin: 18,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  confirmText: { color: "#fff", fontWeight: "700" },

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

  activeStationRow: { backgroundColor: "#FF7A00", borderColor: "#FF7A00" },

  stationName: { fontSize: 14, fontWeight: "700", color: "#000" },
  stationLocation: { fontSize: 12, color: "#777", marginTop: 2 },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },

  modalTitle: { fontSize: 18, fontWeight: "700" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 18,
    marginBottom: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  searchInput: { flex: 1, fontSize: 14 },

  modalStationRow: {
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
});