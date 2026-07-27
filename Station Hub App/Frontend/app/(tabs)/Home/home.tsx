import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRouter } from "expo-router";
import Bottomnav from "@/components/Bottomnav";

import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { API_BASE } from "../../../src/config"; // adjust relative path as needed
import { useUser } from "../../../context/userContext";
import { apiFetch } from "../../../src/api";
import { useHardwareDoubleBackToExit } from "@/hooks/useHardwareDoubleBackToExit";


export default function HomeScreen() {
  // Hardware back only: double-press exits. Never open splash/auth again.
  useHardwareDoubleBackToExit({ allowNavigateBack: false });

  const router = useRouter();
  const { user, loading } = useUser();

  const [stations, setStations] = useState<any[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [stationsError, setStationsError] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "rated" | "nearest" | "popular"
  const [unreadCount, setUnreadCount] = useState(0);
  const [userCity, setUserCity] = useState("Your Location");

  const limit = 10;
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

const fetchStations = async (cursor: string | null = null) => {
  if (!cursor) {
    setLoadingStations(true);
    const cached = await AsyncStorage.getItem("home_stations");
    if (cached) setStations(JSON.parse(cached));
  }
  setStationsError("");
  try {
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) query.set("cursor", cursor);

    const res = await apiFetch(`${API_BASE}/stations/public?${query.toString()}`);
    const data = await res.json();
    if (res.ok) {
      const fetchedStations = data.stations || [];
      if (!cursor) {
        setStations(fetchedStations);
        AsyncStorage.setItem("home_stations", JSON.stringify(fetchedStations));
      } else {
        setStations((prev) => [...prev, ...fetchedStations]);
      }
      setNextCursor(data.next_cursor || null);
      setHasMore(Boolean(data.next_cursor));
    } else {
      setStationsError(data.detail || "Failed to load stations");
    }
  } catch (e) {
    setStationsError("Cannot connect to server");
  } finally {
    setLoadingStations(false);
  }
};

  const loadMore = () => {
    if (!loadingStations && hasMore && nextCursor) {
      fetchStations(nextCursor);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      fetchStations(null);
      const [city, token] = await Promise.all([
        AsyncStorage.getItem("user_city"),
        AsyncStorage.getItem("token"),
      ]);
      if (cancelled) return;
      if (city) setUserCity(city);
      if (!token) return;
      try {
        const res = await apiFetch(`${API_BASE}/bookings/unread-count`);
        const data = await res.json();
        if (!cancelled && res.ok) setUnreadCount(data.unread_count || 0);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortOptions = [
    { key: "newest", label: "Newest" },
    { key: "rated", label: "Top Rated" },
    { key: "nearest", label: "Nearest" },
    { key: "popular", label: "Popular" },
  ];

  const sortedStations = React.useMemo(() => {
    const list = [...stations];
    if (sortBy === "newest") {
      list.sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || ""),
      );
    } else if (sortBy === "rated") {
      list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    } else if (sortBy === "popular") {
      list.sort((a, b) => (b.booking_count || 0) - (a.booking_count || 0));
    }
    // "nearest" — no data yet, list stays in default order for now
    return list;
  }, [stations, sortBy]);
const StationSkeleton = () => (
  <View style={styles.serviceCard}>
    <View style={[styles.serviceImage, { backgroundColor: "#e0e0e0" }]} />
    <View style={{ flex: 1, justifyContent: "center" }}>
      <View style={{ width: "70%", height: 16, backgroundColor: "#e0e0e0", borderRadius: 4, marginBottom: 8 }} />
      <View style={{ width: "90%", height: 12, backgroundColor: "#e0e0e0", borderRadius: 4, marginBottom: 8 }} />
      <View style={{ width: "40%", height: 12, backgroundColor: "#e0e0e0", borderRadius: 4 }} />
    </View>
    <View style={{ width: 18, height: 18, backgroundColor: "#e0e0e0", borderRadius: 9 }} />
  </View>
);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sortedStations}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListFooterComponent={loadingStations && nextCursor ? <ActivityIndicator size="small" color="#FF7A45" style={{ marginVertical: 20 }} /> : null}
        ListEmptyComponent={loadingStations && !nextCursor ? (
          <View>
            <StationSkeleton />
            <StationSkeleton />
            <StationSkeleton />
            <StationSkeleton />
            <StationSkeleton />
          </View>
        ) : null}
        ListHeaderComponent={
          <>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <Image
source={user?.profile_image ? { uri: user.profile_image } : require("../../../assets/images/johndoe.png")}              style={styles.profile}
            />

            <View>
              <Text style={styles.name}>{user?.full_name}</Text>

              <View style={styles.location}>
                <Ionicons name="location-sharp" size={15} color="#FF7A45" />

                <Text style={styles.locationText}>
                  {userCity}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.iconSection}>
            {/* <Ionicons name="search-outline" size={24} color="#333" /> */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/Home/notifications")}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="notifications-outline" size={24} color="#333" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* BANNER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 20 }}
        >
          <Image
            source={require("../../../assets/images/banner1.png")}
            style={styles.banner}
          />
          <Image
            source={require("../../../assets/images/banner2.png")}
            style={styles.banner}
          />
          <Image
            source={require("../../../assets/images/banner3.png")}
            style={styles.banner}
          />
        </ScrollView>

        {/* CATEGORY */}
        <Text style={styles.heading}>Service Categories</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryCard}>
            <MaterialIcons name="local-car-wash" size={28} color="#FF7A45" />
            <Text style={styles.categoryText}>Express Wash</Text>
          </View>

          <View style={styles.categoryCard}>
            <FontAwesome5 name="car-side" size={24} color="#FF7A45" />
            <Text style={styles.categoryText}>Premium</Text>
          </View>

          <View style={styles.categoryCard}>
            <Ionicons name="sparkles-outline" size={28} color="#FF7A45" />
            <Text style={styles.categoryText}>Interior</Text>
          </View>

          <View style={styles.categoryCard}>
            <MaterialIcons name="build-circle" size={28} color="#FF7A45" />
            <Text style={styles.categoryText}>Engine</Text>
          </View>
        </ScrollView>

        {/* STATIONS */}
        <Text style={styles.heading}>Explore Stations</Text>

        {/* SORT BUTTONS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 10 }}
        >
          {sortOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.sortBtn,
                sortBy === opt.key && styles.sortBtnActive,
              ]}
              onPress={() => setSortBy(opt.key)}
            >
              <Text
                style={[
                  styles.sortBtnText,
                  sortBy === opt.key && styles.sortBtnTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        </>
      }
      renderItem={({ item: station }) => {
        const locationLabel = [station.address, station.city]
          .filter(Boolean)
          .join(", ");
        return (
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/Home/stationdetail",
                params: { 
                  station_id: station.id,
                  station_data: JSON.stringify(station)
                },
              })
            }
          >
            {station.image_url ? (
              <Image
                source={{ uri: station.image_url }}
                style={styles.serviceImage}
              />
            ) : (
              <Image
                source={require("../../../assets/images/service1.png")}
                style={styles.serviceImage}
              />
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>{station.name}</Text>
              {locationLabel ? (
                <Text style={styles.serviceLocation}>{locationLabel}</Text>
              ) : null}
              <View style={styles.ratingRow}>
                <Text style={styles.ratingText}>
                  {station.avg_rating > 0
                    ? station.avg_rating.toFixed(1)
                    : "New"}
                </Text>
                {station.avg_rating > 0 && (
                  <Text style={styles.ratingStar}>★</Text>
                )}
                {station.rating_count > 0 && (
                  <Text style={styles.ratingCountText}>
                    {" "}
                    ({station.rating_count})
                  </Text>
                )}
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        );
      }}
      />

      <Bottomnav />
    </SafeAreaView>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fffdfb",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 10,
  },

  userSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  profile: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },

  location: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  locationText: {
    fontSize: 12,
    color: "gray",
    marginLeft: 4,
    maxWidth: 160,
  },

  iconSection: {
    flexDirection: "row",
  },

  banner: {
    width: 310,
    height: 160,
    borderRadius: 25,
    marginLeft: 15,
    marginRight: 10,
  },

  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 25,
    marginLeft: 15,
    marginBottom: 10,
  },

  categoryCard: {
    width: 110,
    height: 100,
    backgroundColor: "#FFF1E8",
    marginLeft: 15,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  categoryText: {
    marginTop: 8,
    fontSize: 12,
  },

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 12,
    borderRadius: 20,
    elevation: 4,
  },

  serviceImage: {
    width: 70,
    height: 70,
    borderRadius: 15,
    marginRight: 12,
  },

  serviceTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },

  sortBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFF1E8",
    marginLeft: 15,
  },

  sortBtnActive: {
    backgroundColor: "#FF7A45",
  },

  sortBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF7A45",
  },

  sortBtnTextActive: {
    color: "#fff",
  },

  stationsMsg: {
    textAlign: "center",
    color: "#888",
    marginTop: 10,
    marginHorizontal: 18,
  },

  serviceLocation: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginRight: 4,
  },

  ratingStar: {
    fontSize: 13,
    color: "#FFB400",
  },

  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  notifBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },

  ratingCountText: {
    fontSize: 11,
    color: "#999",
  },
});
