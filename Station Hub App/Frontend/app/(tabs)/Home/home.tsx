import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRouter } from "expo-router";
import Bottomnav from "@/components/Bottomnav";
import ExploreStation from "@/components/Explore_station";

import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { API_BASE } from "../../../src/config";
import { useUser } from "../../../context/userContext";
import { apiFetch } from "../../../src/api";
import { useHardwareDoubleBackToExit } from "@/hooks/useHardwareDoubleBackToExit";

const SEARCH_DEBOUNCE_MS = 400;

const BOOKING_SHORTCUTS: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "upcoming", label: "Upcoming", icon: "calendar-outline" },
  { key: "completed", label: "Completed", icon: "checkmark-circle-outline" },
  { key: "closed", label: "Closed", icon: "close-circle-outline" },
];

export default function HomeScreen() {
  useHardwareDoubleBackToExit({ allowNavigateBack: false });

  const router = useRouter();
  const { user, loading } = useUser();

  const [unreadCount, setUnreadCount] = useState(0);
  const [userCity, setUserCity] = useState("Your Location");

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // One vertical ScrollView — pass ref + live Y offset down to ExploreStation
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchText]);

  const openBookings = (tab: string) => {
    router.push({
      pathname: "/(tabs)/profile/bookingHistory/bookinghistory",
      params: { tab },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <Image
              source={
                user?.profile_image
                  ? { uri: user.profile_image }
                  : require("../../../assets/images/johndoe.png")
              }
              style={styles.profile}
            />

            <View>
              <Text style={styles.name}>{user?.full_name}</Text>

              <View style={styles.location}>
                <Ionicons name="location-sharp" size={15} color="#0f3c5c" />
                <Text style={styles.locationText}>{userCity}</Text>
              </View>
            </View>
          </View>

          <View style={styles.iconSection}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/Home/notifications")}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="notifications-outline" size={24} color="#0f3c5c" />
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

        {/* SEARCH BAR */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations..."
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
        </View>

        {/* BANNER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 15 }}
        >
          <Image
            source={require("../../../assets/images/car_wash.png")}
            style={styles.banner}
          />
          <Image
            source={require("../../../assets/images/autowash.jpg")}
            style={styles.banner}
          />
          <Image
            source={require("../../../assets/images/car_platform.jpg")}
            style={styles.banner}
          />
        </ScrollView>

        {/* MY BOOKINGS */}
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>My Bookings</Text>
        </View>
        <View style={styles.bookingRow}>
          {BOOKING_SHORTCUTS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.bookingBtn}
              activeOpacity={0.8}
              onPress={() => openBookings(item.key)}
            >
              <Ionicons name={item.icon} size={20} color="#0f3c5c" />
              <Text style={styles.bookingBtnText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SERVICE CATEGORIES */}
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>Service Categories</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryCard}>
            <MaterialIcons name="local-car-wash" size={28} color="#0f3c5c" />
            <Text style={styles.categoryText}>Express Wash</Text>
          </View>

          <View style={styles.categoryCard}>
            <FontAwesome5 name="car-side" size={24} color="#0f3c5c" />
            <Text style={styles.categoryText}>Premium</Text>
          </View>

          <View style={styles.categoryCard}>
            <Ionicons name="sparkles-outline" size={28} color="#0f3c5c" />
            <Text style={styles.categoryText}>Interior</Text>
          </View>

          <View style={styles.categoryCard}>
            <MaterialIcons name="build-circle" size={28} color="#0f3c5c" />
            <Text style={styles.categoryText}>Engine</Text>
          </View>
        </ScrollView>

        {/* EXPLORE STATIONS — pass scroll ref + live Y so HEV / Show more work */}
        <ExploreStation
          searchQuery={debouncedSearch}
          scrollRef={scrollViewRef}
          scrollYRef={scrollYRef}
        />
      </ScrollView>

      <Bottomnav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // Updated to match the light blue/clean theme background
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
    color: "#0f3c5c", // Adjusted for better contrast with the blue theme
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

  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e2edf5", // Updated to a soft blue tint matching the theme
    borderRadius: 14,
    marginHorizontal: 18,
    paddingHorizontal: 14,
    height: 44,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0f3c5c",
  },

  banner: {
    width: 310,
    height: 160,
    borderRadius: 25,
    marginLeft: 15,
    marginRight: 10,
  },

  // Theme pill headings (My Bookings / Service Categories) updated to match the blue theme[cite: 1]
  headingWrap: {
    alignSelf: "flex-start",
    backgroundColor: "#e2edf5", // Updated to a matching soft blue background tint[cite: 1]
    borderRadius: 16,
    marginTop: 25,
    marginLeft: 15,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1d8cf8", // Updated to a vibrant blue color matching the image background theme[cite: 1]
  },

  bookingRow: {
    flexDirection: "row",
    marginHorizontal: 10,
    gap: 10,
  },

bookingBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2edf5", // Updated to match the blue theme[cite: 1]
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    maxWidth: 100,
  },
  bookingBtnText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#1d8cf8", // Updated to match the blue theme[cite: 1]
  },

  categoryCard: {
    width: 83,
    height: 60,
    backgroundColor: "#e2edf5", // Updated to match the blue theme[cite: 1]
    marginLeft: 15,
    borderRadius: 16, // Matched border radius for design consistency
    justifyContent: "center",
    alignItems: "center",
    marginBottom:16,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 12,
    color: "#1d8cf8",
   
  },

  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#392322",
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
});