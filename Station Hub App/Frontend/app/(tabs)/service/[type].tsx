import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Bottomnav from "@/components/Bottomnav";
import { API_BASE } from "../../../src/config"; // adjust relative path as needed
import { apiFetch } from "../../../src/api";


type Tier = { price: number; duration: string };
type Service = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  rating?: number;
  image_url?: string;
  tiers?: { base?: Tier; premium?: Tier };
  station_ids?: string[];
};

export default function ServicesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    highlight_id?: string;
  }>();

  const [activeTab, setActiveTab] = useState(
    params.type === "premium" ? params.type : "basic",
  );
  const [services, setServices] = useState<Service[]>([]);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "" });

  // ---- highlight / scroll-to-card / pop animation ----
  const scrollViewRef = useRef<ScrollView>(null);
  const cardYPositions = useRef<Map<string, number>>(new Map());
  const cardScales = useRef<Map<string, Animated.Value>>(new Map());
  const cardShakes = useRef<Map<string, Animated.Value>>(new Map());
  const [highlightId, setHighlightId] = useState<string | null>(
    params.highlight_id ?? null,
  );
  const hasScrolledForThisNav = useRef(false);

  // whenever a fresh highlight_id arrives (new navigation from Favorites),
  // reset so the pop can fire again
  useEffect(() => {
    if (params.highlight_id) {
      setHighlightId(params.highlight_id);
      hasScrolledForThisNav.current = false;
    }
  }, [params.highlight_id]);

  useEffect(() => {
    if (params.type === "premium" || params.type === "basic") {
      setActiveTab(params.type);
    }
  }, [params.type]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // runs when screen loses focus — clear highlight so it doesn't persist
        setHighlightId(null);
        hasScrolledForThisNav.current = false;
      };
    }, []),
  );

  const getScaleFor = (id: string) => {
    if (!cardScales.current.has(id)) {
      cardScales.current.set(id, new Animated.Value(1));
    }
    return cardScales.current.get(id)!;
  };

  const getShakeFor = (id: string) => {
    if (!cardShakes.current.has(id)) {
      cardShakes.current.set(id, new Animated.Value(0));
    }
    return cardShakes.current.get(id)!;
  };

  const triggerPop = (id: string) => {
    const scale = getScaleFor(id);
    const shake = getShakeFor(id);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.06,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(shake, {
          toValue: 6,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: -6,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 5,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: -5,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 3,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 0,
          duration: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // force back to exact resting values, no matter what
      scale.setValue(1);
      shake.setValue(0);
      // remove the highlight border once the pop is done
      setHighlightId(null);
    });
  };

  // const handleCardLayout = (id: string, y: number) => {
  //   cardYPositions.current.set(id, y);
  //   // if this is the card we're waiting to highlight, scroll + pop now
  //   if (highlightId && id === highlightId && !hasScrolledForThisNav.current) {
  //     hasScrolledForThisNav.current = true;
  //     requestAnimationFrame(() => {
  //       scrollViewRef.current?.scrollTo({
  //         y: Math.max(y - 20, 0),
  //         animated: true,
  //       });
  //       triggerPop(id);
  //     });
  //   }
  // };
  const handleCardLayout = (id: string, y: number) => {
    cardYPositions.current.set(id, y);
  };

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 1800);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // show cached data instantly
        const cachedServices = await AsyncStorage.getItem("cached_services");
        const cachedFavs = await AsyncStorage.getItem("cached_favorites");
        if (cachedServices) {
          setServices(JSON.parse(cachedServices));
          setLoading(false);
        }
        if (cachedFavs) {
          setFavoriteKeys(new Set(JSON.parse(cachedFavs)));
        }

        const token = await AsyncStorage.getItem("token");

        // fetch both at the same time
        const [servicesRes, favRes] = await Promise.all([
          apiFetch(`${API_BASE}/services/public`),
          token
            ? apiFetch(`${API_BASE}/favorites/`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve(null),
        ]);

        const servicesData = await servicesRes.json();
        if (servicesRes.ok) {
          setServices(servicesData.services || []);
          AsyncStorage.setItem(
            "cached_services",
            JSON.stringify(servicesData.services || []),
          );
        } else {
          if (!cachedServices)
            setError(servicesData.detail || "Failed to load services");
        }

        if (favRes && favRes.ok) {
          const favData = await favRes.json();
          const keys = (favData.services || []).map(
            (s: any) => `${s.id}_${s.tier}`,
          );
          setFavoriteKeys(new Set(keys));
          AsyncStorage.setItem("cached_favorites", JSON.stringify(keys));
        }
      } catch (e) {
        if (!(await AsyncStorage.getItem("cached_services"))) {
          setError("Cannot connect to server");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFavorite = async (serviceId: string, tier: string) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      showToast("Please log in to save favorites");
      return;
    }

    const key = `${serviceId}_${tier}`;
    const isFavorited = favoriteKeys.has(key);

    setFavoriteKeys((prev) => {
      const next = new Set(prev);
      if (isFavorited) next.delete(key);
      else next.add(key);
      return next;
    });

    try {
      if (isFavorited) {
        await apiFetch(`${API_BASE}/favorites/${serviceId}/${tier}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Removed from favorites");
      } else {
        await apiFetch(`${API_BASE}/favorites/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ service_id: serviceId, tier }),
        });
        showToast("Added to favorites");
      }
    } catch (e) {
      setFavoriteKeys((prev) => {
        const next = new Set(prev);
        if (isFavorited) next.add(key);
        else next.delete(key);
        return next;
      });
      showToast("Something went wrong");
    }
  };

  const tierKey =
    activeTab === "premium" ? "premium" : activeTab === "basic" ? "base" : null;
  const filteredServices = tierKey
    ? services.filter((s) => s.tiers && s.tiers[tierKey])
    : [];

  useEffect(() => {
    if (
      !loading &&
      highlightId &&
      !hasScrolledForThisNav.current &&
      filteredServices.some((s) => s.id === highlightId)
    ) {
      hasScrolledForThisNav.current = true;
      requestAnimationFrame(() => {
        const y = cardYPositions.current.get(highlightId);
        if (y !== undefined) {
          scrollViewRef.current?.scrollTo({
            y: Math.max(y - 20, 0),
            animated: true,
          });
        }
        triggerPop(highlightId);
      });
    }
  }, [loading, highlightId, filteredServices]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF4EC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF4EC" />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingHorizontal: 16,
          paddingTop: 0,
        }}
      >
        {/* HEADER */}
<View style={styles.header}>
  <TouchableOpacity onPress={() => router.back()}>
    <Ionicons name="arrow-back" size={22} color="#000" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Services</Text>
  <View style={{ width: 24 }} />
</View>

        {/* TABS */}
        <View style={styles.tabContainer}>
          {["basic", "premium"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                setHighlightId(null);
                hasScrolledForThisNav.current = false;
              }}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
        {!loading && error && (
          <Text
            style={{ textAlign: "center", color: "#e74c3c", marginTop: 20 }}
          >
            {error}
          </Text>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredServices.length === 0 && (
          <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>
            No services available in this category yet.
          </Text>
        )}

        {/* CARDS */}
        {!loading &&
          !error &&
          tierKey &&
          filteredServices.map((service) => {
            const tier = service.tiers![tierKey]!;
            const isFavorited = favoriteKeys.has(`${service.id}_${tierKey}`);
            const isHighlighted = service.id === highlightId;
            return (
              <Animated.View
                key={service.id}
                onLayout={(e) =>
                  handleCardLayout(service.id, e.nativeEvent.layout.y)
                }
                style={[
                  styles.card,
                  {
                    transform: [
                      { scale: getScaleFor(service.id) },
                      { translateX: getShakeFor(service.id) },
                    ],
                  },
                  isHighlighted && styles.highlightedCard,
                ]}
              >
                <View>
                  {service.image_url ? (
                    <Image
                      source={{ uri: service.image_url }}
                      style={styles.image}
                    />
                  ) : (
                    <Image
                      source={require("../../../assets/images/service1.png")}
                      style={styles.image}
                    />
                  )}
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => toggleFavorite(service.id, tierKey)}
                  >
                    <Ionicons
                      name={isFavorited ? "heart" : "heart-outline"}
                      size={18}
                      color="#FF7A00"
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.title}>{service.name}</Text>
                  {service.description ? (
                    <Text style={styles.subtitle}>{service.description}</Text>
                  ) : null}

                  <View style={styles.infoRow}>
                    {service.rating ? (
                      <View style={styles.infoItem}>
                        <Ionicons name="star" size={14} color="#FF8C42" />
                        <Text style={styles.infoText}>
                          {Number(service.rating).toFixed(1)}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.infoItem}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.infoText}>{tier.duration}</Text>
                    </View>
                  </View>

                  <View style={styles.bottomRow}>
                    <Text style={styles.price}>
                      PKR {Number(tier.price).toLocaleString()}
                    </Text>
                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={styles.scheduleBtn}
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/Booking/booking",
                            params: {
                              service_id: service.id,
                              tier: tierKey,
                              name: service.name,
                              price: String(tier.price),
                              duration: tier.duration,
                              image_url: service.image_url || "",
                              station_ids: JSON.stringify(
                                service.station_ids || [],
                              ),
                            },
                          })
                        }
                      >
                        <Text style={styles.scheduleText}>Schedule</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}
      </ScrollView>

      {toast.visible && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
      <Bottomnav />
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
    marginVertical: 28,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },

  profileImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
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

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 3,
  },

  highlightedCard: {
    borderWidth: 2,
    borderColor: "#FF8C42",
  },

  image: {
    width: 110,
    height: 160,
  },

  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },

  subtitle: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  infoText: {
    fontSize: 11,
    color: "#666",
  },

  bottomRow: {
    justifyContent: "space-between",
  },

  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF8C42",
    marginBottom: 10,
  },

  btnRow: {
    flexDirection: "row",
    gap: 8,
  },

  scheduleBtn: {
    backgroundColor: "#FF8C42",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  scheduleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  viewBtn: {
    borderWidth: 1,
    borderColor: "#FF8C42",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  viewText: {
    color: "#FF8C42",
    fontSize: 12,
    fontWeight: "600",
  },

  toast: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "#333",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 6,
  },

  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
