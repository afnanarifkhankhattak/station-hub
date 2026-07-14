
import { useUser } from "../../context/userContext";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Bottomnav from "@/components/Bottomnav";
import { API_BASE } from "../../src/config"; // adjust relative path as needed
import { apiFetch } from "../../src/api";


type Tier = { price: number; duration: string };
type Service = {
  id: string;
  name: string;
  description?: string;
  rating?: number;
  image_url?: string;
  tier?: string;
  tiers?: { base?: Tier; premium?: Tier };
};

export default function Favorites() {
  const router = useRouter();
  const { user } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFavorites = async () => {
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setError("Please log in to view favorites");
        setServices([]);
        return;
      }

      // show cached data instantly
      const cached = await AsyncStorage.getItem("cached_favorites_full");
      if (cached) {
        setServices(JSON.parse(cached));
        setLoading(false);
      }

      // fetch fresh in background
      const res = await apiFetch(`${API_BASE}/favorites/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setServices(data.services || []);
        AsyncStorage.setItem(
          "cached_favorites_full",
          JSON.stringify(data.services || []),
        );
      } else {
        if (!cached) setError(data.detail || "Failed to load favorites");
      }
    } catch (e) {
      if (!(await AsyncStorage.getItem("cached_favorites_full"))) {
        setError("Cannot connect to server");
      }
    } finally {
      setLoading(false);
    }
  };

  // refetch every time this tab comes into focus, so unfavoriting
  // elsewhere (e.g. the services screen) stays in sync
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, []),
  );

  const handleUnfavorite = async (serviceId: string, tier: string) => {
    setRemovingId(`${serviceId}_${tier}`);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      await apiFetch(`${API_BASE}/favorites/${serviceId}/${tier}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices((prev) => {
        const updated = prev.filter(
          (s) => !(s.id === serviceId && s.tier === tier),
        );
        AsyncStorage.setItem("cached_favorites_full", JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      // leave it in the list if the request failed
    } finally {
      setRemovingId(null);
    }
  };

  // navigate to the service's tier screen and ask it to highlight this card
  const handleCardPress = (item: Service) => {
    const type = item.tier === "premium" ? "premium" : "basic";
    router.push({
      pathname: "/(tabs)/service/[type]",
      params: { type, highlight_id: item.id },
    });
  };

  return (
    <LinearGradient
      colors={["#fffdfb", "#fff6f0", "#ffe8d8"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
<View style={styles.header}>
  <Text style={styles.title}>Favorites</Text>
  <Image
    source={
      user?.profile_image
        ? { uri: user.profile_image }
        : require("../../assets/images/johndoe.png")
    }
    style={{ width: 40, height: 40, borderRadius: 20 }}
  />
</View>

        {/* SORT + FILTER */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.button}>
            <Ionicons name="swap-vertical" size={16} />
            <Text style={styles.btnText}>Sort</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Ionicons name="filter" size={16} />
            <Text style={styles.btnText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color="#FF8C42" size="large" />
          </View>
        )}

        {!loading && error && (
          <Text
            style={{ textAlign: "center", color: "#e74c3c", marginTop: 20 }}
          >
            {error}
          </Text>
        )}

        {!loading && !error && services.length === 0 && (
          <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>
            You haven't favorited any services yet.
          </Text>
        )}

        {/* CARDS */}
        {!loading && !error && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {services.map((item) => (
              <TouchableOpacity
                key={`${item.id}_${item.tier}`}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handleCardPress(item)}
              >
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                  />
                ) : (
                  <Image
                    source={require("../../assets/images/service1.png")}
                    style={styles.image}
                  />
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.tierLabel}>
                    {item.tier === "premium" ? "Premium" : "Base"}
                  </Text>

                  {item.rating ? (
                    <View style={styles.rating}>
                      <FontAwesome name="star" size={12} color="#FFB300" />
                      <Text style={styles.small}>
                        {Number(item.rating).toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleUnfavorite(item.id, item.tier!);
                  }}
                  disabled={removingId === `${item.id}_${item.tier}`}
                >
                  {removingId === `${item.id}_${item.tier}` ? (
                    <ActivityIndicator size="small" color="#ff7a00" />
                  ) : (
                    <Ionicons name="heart" size={22} color="#ff7a00" />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
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
    backgroundColor: "#FFF4EC",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 28,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  profile: {
    width: 35,
    height: 35,
    borderRadius: 18,
  },

  filterContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  button: {
    flex: 1,
    backgroundColor: "#FFF7F1",
    borderRadius: 25,
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#FFD6BF",
  },

  btnText: {
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 15,
    padding: 10,
    elevation: 3,
    alignItems: "center",
  },

  image: {
    width: 75,
    height: 75,
    borderRadius: 10,
    marginRight: 10,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
  },

  tierLabel: {
    color: "#FF7A00",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },

  small: {
    color: "gray",
    fontSize: 12,
  },
});
