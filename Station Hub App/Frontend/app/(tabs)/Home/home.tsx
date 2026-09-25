import React, { useState, useEffect,useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRouter } from "expo-router";
import Bottomnav from "@/components/Bottomnav";
import ExploreStation from "@/components/Explore_station";

import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { API_BASE } from "../../../src/config"; // adjust relative path as needed
import { useUser } from "../../../context/userContext";
import { apiFetch } from "../../../src/api";
import { useHardwareDoubleBackToExit } from "@/hooks/useHardwareDoubleBackToExit";

const SEARCH_DEBOUNCE_MS = 400;

export default function HomeScreen() {
  // Hardware back only: double-press exits. Never open splash/auth again.
  useHardwareDoubleBackToExit({ allowNavigateBack: false });

  const router = useRouter();
  const { user, loading } = useUser();

  const [unreadCount, setUnreadCount] = useState(0);
  const [userCity, setUserCity] = useState("Your Location");

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // 1. Create the scroll ref here
  const scrollViewRef = useRef(null);

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

  // Debounced: wait for the user to stop typing before it feeds the
  // ExploreStation component below, so it isn't refetching on every
  // keystroke. This stays on the Home screen — no navigation.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchText]);

  return (
    <SafeAreaView style={styles.container}  ref={scrollViewRef}>
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View  ref={scrollViewRef} style={styles.header}>
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
                <Ionicons name="location-sharp" size={15} color="#FF7A45" />
                <Text style={styles.locationText}>{userCity}</Text>
              </View>
            </View>
          </View>

          <View style={styles.iconSection}>
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

        {/* SEARCH BAR (debounced, navigates to Explore) */}
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
          style={{ marginTop: 15 }}  ref={scrollViewRef}
        >
          <Image source={require("../../../assets/images/banner1.png")} style={styles.banner} />
          <Image source={require("../../../assets/images/banner2.png")} style={styles.banner} />
          <Image source={require("../../../assets/images/banner3.png")} style={styles.banner} />
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

        {/* EXPLORE STATIONS — categories, sort tabs, list, show-more, all in one component */}
        <ExploreStation searchQuery={debouncedSearch}  />
      </ScrollView>

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

  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF1E8",
    borderRadius: 14,
    marginHorizontal: 18,
    paddingHorizontal: 14,
    height: 44,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
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
    width: 90,
    height: 70,
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
});