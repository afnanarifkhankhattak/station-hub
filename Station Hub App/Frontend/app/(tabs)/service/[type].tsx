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


type CategoryPrice = { price: number };
type Service = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  rating?: number;
  image_url?: string;
  categories?: Record<string, CategoryPrice>;
  station_ids?: string[];
};

export default function ServicesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    highlight_id?: string;
  }>();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---- highlight / scroll-to-card / pop animation ----
  const scrollViewRef = useRef<ScrollView>(null);
  const cardYPositions = useRef<Map<string, number>>(new Map());
  const cardScales = useRef<Map<string, Animated.Value>>(new Map());
  const cardShakes = useRef<Map<string, Animated.Value>>(new Map());
  const [highlightId, setHighlightId] = useState<string | null>(
    params.highlight_id ?? null,
  );
  const hasScrolledForThisNav = useRef(false);

  // whenever a fresh highlight_id arrives,
  // reset so the pop can fire again
  useEffect(() => {
    if (params.highlight_id) {
      setHighlightId(params.highlight_id);
      hasScrolledForThisNav.current = false;
    }
  }, [params.highlight_id]);

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // show cached data instantly
        const cachedServices = await AsyncStorage.getItem("cached_services");
        if (cachedServices) {
          setServices(JSON.parse(cachedServices));
          setLoading(false);
        }
        const servicesRes = await apiFetch(`${API_BASE}/services/public`);

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

  const filteredServices = services.filter((service) => Object.keys(service.categories || {}).length > 0);

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
          filteredServices.map((service) => {
            const prices = Object.values(service.categories || {}).map((category) => category.price);
            const startingPrice = Math.min(...prices);
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
                  </View>

                  <View style={styles.bottomRow}>
                    <Text style={styles.price}>
                      From PKR {Number(startingPrice).toLocaleString()}
                    </Text>
                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={styles.scheduleBtn}
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/Booking/booking",
                            params: {
                              service_id: service.id,
                              name: service.name,
                              price: String(startingPrice),
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

});
