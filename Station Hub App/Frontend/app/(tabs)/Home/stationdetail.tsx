import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "base-64";

import { useRouter, useLocalSearchParams } from "expo-router";
import { uiGoBack } from "@/utils/uiGoBack";
import Bottomnav from "@/components/Bottomnav";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { API_BASE } from "../../../src/config"; // adjust relative path as needed
import { apiFetch } from "../../../src/api";
import About from "@/components/About";
import HevAbout from "@/components/Hev_About";

const { width } = Dimensions.get("window");

// Maps service name keywords to an icon — falls back to a generic icon
const getServiceIcon = (name: string): any => {
  const n = name.toLowerCase();
  if (n.includes("express") || n.includes("wash")) return "car-outline";
  if (n.includes("premium") || n.includes("detail")) return "ribbon-outline";
  if (n.includes("interior")) return "color-fill-outline";
  if (n.includes("engine")) return "cog-outline";
  if (n.includes("wax")) return "shield-checkmark-outline";
  if (n.includes("tyre") || n.includes("tire")) return "ellipse-outline";
  if (n.includes("maintain") || n.includes("maintenance")) return "construct-outline";
  return "sparkles-outline";
};

const getServicePricing = (service: any): { price: number } | null => {
  if (service?.categories && Object.keys(service.categories).length > 0) {
    const firstCat = Object.values(service.categories)[0] as any;
    if (firstCat?.price != null) return firstCat;
  }
  if (service?.price != null) return { price: service.price };
  return null;
};

export default function StationDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { station_id, station_data } = useLocalSearchParams<{ station_id: string; station_data?: string }>();

  const initialStation = station_data ? JSON.parse(station_data) : null;
  const [station, setStation] = useState<any>(initialStation);
  const [loading, setLoading] = useState(!initialStation);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState("");

  const [services, setServices] = useState<any[]>([]);

  const [userRating, setUserRating] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(initialStation?.avg_rating || 0);
  const [ratingCount, setRatingCount] = useState<number>(initialStation?.rating_count || 0);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingMsg, setRatingMsg] = useState("");
  const [reRating, setReRating] = useState(false);

  // HEV stations don't have car-wash "services" — About vs HevAbout branches on this.
  const isHev = station?.station_type === "HEV";

  useEffect(() => {
    if (!station_id) return;

    const fetchStation = async () => {
      if (!initialStation) setLoading(true);
      setLoadingServices(true);
      setError("");
      try {
        // fetch both at the same time
        const [stationRes, servicesRes] = await Promise.all([
          apiFetch(`${API_BASE}/stations/public/${station_id}`),
          apiFetch(`${API_BASE}/services/public/station/${station_id}`),
        ]);

        const stationData = await stationRes.json();
        const servicesData = await servicesRes.json();

        if (stationRes.ok) {
          const s = stationData.station;
          setStation(s);
          setAvgRating(s.avg_rating || 0);
          setRatingCount(s.rating_count || 0);

          // check if current user already rated
          const token = await AsyncStorage.getItem("token");
          if (token) {
            const payload = JSON.parse(decode(token.split(".")[1]));
            const userId = payload.sub;
            const existingRating = s.ratings?.[userId];
            if (existingRating) {
              setUserRating(existingRating);
              setSelectedRating(existingRating);
            }
          }
        } else {
          setError(stationData.detail || "Failed to load station");
        }

        if (servicesRes.ok) {
          setServices(servicesData.services || []);
        }
      } catch (e) {
        if (!initialStation) setError("Cannot connect to server");
      } finally {
        setLoading(false);
        setLoadingServices(false);
      }
    };

    fetchStation();
  }, [station_id]);

  const handleScheduleService = (service: any) => {
    const pricing = getServicePricing(service);
    if (!pricing) return;
    router.push({
      pathname: "/(tabs)/Booking/booking",
      params: {
        service_id: service.id,
        name: service.name,
        price: String(pricing.price),
        image_url: service.image_url || "",
        station_ids: JSON.stringify(service.station_ids || []),
      },
    });
  };

  const locationLabel = station
    ? [station.address, station.city].filter(Boolean).join(", ")
    : "";

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#F97316" size="large" />
      </View>
    );
  }

  if (error || !station) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error || "Station not found"}</Text>
      </View>
    );
  }

  const submitRating = async () => {
    if (!selectedRating) return;
    setSubmittingRating(true);
    setRatingMsg("");
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await apiFetch(`${API_BASE}/stations/${station_id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: selectedRating }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserRating(selectedRating);
        setAvgRating(data.avg_rating);
        setRatingCount(data.rating_count);
        setReRating(false);
        setRatingMsg("Thanks for your rating!");
      } else {
        setRatingMsg(data.detail || "Failed to submit rating");
      }
    } catch (e) {
      setRatingMsg("Cannot connect to server");
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDE9E6" />

      {/* HEADER — title on top, back arrow underneath it */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>{station.name}</Text>

        <TouchableOpacity onPress={uiGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* MAIN CARD */}
        <View style={styles.card}>
          {station.image_url ? (
            <Image
              source={{ uri: station.image_url }}
              style={styles.mainImage}
            />
          ) : (
            <Image
              source={require("../../../assets/images/riverside.png")}
              style={styles.mainImage}
            />
          )}

          <Text style={styles.stationTitle}>{station.name}</Text>

          {isHev && (
            <View style={styles.hevPill}>
              <Ionicons name="flash" size={13} color="#16A34A" />
              <Text style={styles.hevPillText}>HEV Charging</Text>
            </View>
          )}

          <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= Math.round(avgRating) ? "star" : "star-outline"}
                size={16}
                color="#F97316"
              />
            ))}
            <Text style={{ marginLeft: 6, fontSize: 12 }}>
              {avgRating > 0
                ? `${avgRating} (${ratingCount})`
                : "No ratings yet"}
            </Text>
          </View>

          {locationLabel ? (
            <View style={styles.row}>
              <Ionicons name="location-sharp" size={16} color="gray" />
              <Text style={styles.locationText}>{locationLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* ABOUT — HEV stations get charger/location details, others get car-wash services */}
        {isHev ? (
          <HevAbout station={station} distanceKm={station._distanceKm} />
        ) : (
          <About
            description={station.description}
            services={services}
            loadingServices={loadingServices}
            onSchedule={handleScheduleService}
          />
        )}

        {/* RATING SECTION */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Rate this Station</Text>

          {userRating > 0 && !reRating ? (
            // already rated
            <View style={{ alignItems: "center" }}>
              <Text style={styles.ratingDoneText}>
                You rated this station {userRating} star
                {userRating > 1 ? "s" : ""}
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Ionicons
                    key={i}
                    name={i <= userRating ? "star" : "star-outline"}
                    size={28}
                    color="#F97316"
                  />
                ))}
              </View>
              <TouchableOpacity
                style={styles.reRateBtn}
                onPress={() => setReRating(true)}
              >
                <Text style={styles.reRateText}>Rate Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // not yet rated or re-rating
            <View style={{ alignItems: "center" }}>
              <Text style={styles.ratingSubText}>
                {reRating ? "Update your rating:" : "Tap a star to rate:"}
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedRating(i)}
                  >
                    <Ionicons
                      name={i <= selectedRating ? "star" : "star-outline"}
                      size={32}
                      color="#F97316"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {ratingMsg ? (
                <Text style={styles.ratingMsg}>{ratingMsg}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.submitRatingBtn,
                  !selectedRating && { opacity: 0.5 },
                ]}
                onPress={submitRating}
                disabled={!selectedRating || submittingRating}
              >
                {submittingRating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitRatingText}>
                    {reRating ? "Update Rating" : "Submit Rating"}
                  </Text>
                )}
              </TouchableOpacity>

              {reRating && (
                <TouchableOpacity
                  onPress={() => {
                    setReRating(false);
                    setSelectedRating(userRating);
                  }}
                >
                  <Text style={styles.cancelReRateText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Bottomnav />
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDE9E6",
  },

  header: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  backButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    padding: 8,
  },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 12,
    borderRadius: 16,
  },

  mainImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    resizeMode: "cover",
  },

  stationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },

  hevPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EAFBF0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },

  hevPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
    marginLeft: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  locationText: {
    marginLeft: 6,
    fontSize: 12,
    color: "gray",
  },

  aboutCard: {
    backgroundColor: "#1B2A41",
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 16,
  },

  aboutTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  aboutText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },

  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 15,
  },

  iconItem: {
    alignItems: "center",
    width: 70,
    marginRight: 18,
    marginBottom: 14,
  },

  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F97316",
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  iconLabel: {
    color: "#fff",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },

  imageGrid: {
    flexDirection: "row",
    marginTop: 15,
    height: 170,
  },

  bigImg: {
    flex: 2,
    height: "100%",
    borderRadius: 12,
    resizeMode: "cover",
  },

  rightColumn: {
    flex: 1,
    marginLeft: 8,
    justifyContent: "space-between",
  },

  smallImg: {
    height: 80,
    width: "100%",
    borderRadius: 12,
    resizeMode: "cover",
  },

  scheduleWrapper: {
    position: "absolute",
    bottom: -1,
    left: -1,
    backgroundColor: "#FDE9E6",
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 16,
    paddingTop: 12,
    paddingRight: 12,
  },
  scheduleBtn: {
    backgroundColor: "#F97316", // slightly lighter orange
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    color: "#888",
    fontSize: 14,
  },

  buttonText: {
    color: "#1a1a1a",
    fontWeight: "bold",
    fontSize: 16,
  },

  offeredHeading: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 8,
  },

  noServicesText: {
    color: "#9aa5b8",
    fontSize: 12,
    fontStyle: "italic",
  },

  ratingCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },

  ratingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },

  ratingSubText: {
    fontSize: 13,
    color: "#888",
    marginBottom: 10,
  },

  ratingDoneText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "600",
    marginBottom: 10,
  },

  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  ratingMsg: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600",
    marginBottom: 10,
  },

  submitRatingBtn: {
    backgroundColor: "#F97316",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },

  submitRatingText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  reRateBtn: {
    borderWidth: 1,
    borderColor: "#F97316",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 8,
  },

  reRateText: {
    color: "#F97316",
    fontWeight: "600",
    fontSize: 13,
  },

  cancelReRateText: {
    color: "#888",
    fontSize: 13,
    marginTop: 10,
  },
});