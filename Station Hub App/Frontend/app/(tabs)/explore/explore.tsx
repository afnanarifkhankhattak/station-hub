import Bottomnav from "@/components/Bottomnav";
import type { Region } from "@/components/Map";
import MapView from "@/components/Map";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE } from "../../../src/config";

type Connector = { type?: string; kw?: number; count?: number };

type Station = {
  id: string;
  name: string;
  address: string;
  city: string;
  image_url?: string;
  avg_rating: number;
  rating_count: number;
  booking_count: number;
  latitude: number;
  longitude: number;
  opening?: string;
  closing?: string;
  sun_off?: boolean;
  status: string;
  created_at: string;
  station_type?: string;
  connectors?: Connector[];
};

type RouteStep = {
  instruction: string;
  distance: number;
  duration: number;
  name?: string;
};

type NavRoute = {
  coords: [number, number][];
  distance: number;
  duration: number;
  steps: RouteStep[];
};

type ServiceCategory = {
  [vehicle: string]: { price: number };
};

type Service = {
  id: string;
  name: string;
  categories: ServiceCategory;
  description?: string;
  status: string;
  rating?: number;
  image_url?: string;
  station_ids: string[];
  owner_id: string;
  created_at: string;
};

type Category = "SERVICE" | "HEV";

const CATEGORY_OPTIONS: {
  key: Category;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { key: "SERVICE", label: "Service Stations", icon: "local-gas-station" },
  { key: "HEV", label: "HEV", icon: "ev-station" },
];

const CATEGORY_TITLE: Record<Category, string> = {
  SERVICE: "Service Stations",
  HEV: "HEV Stations",
};

type SortKey = "nearest" | "rating" | "price_asc" | "price_desc" | "popular";

const SORT_LABELS: Record<SortKey, string> = {
  nearest: "Nearest",
  rating: "Top rated",
  price_asc: "Price: low \u2192 high",
  price_desc: "Price: high \u2192 low",
  popular: "Popular",
};

const RATING_OPTIONS = [0, 3.5, 4.0, 4.5] as const;

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

/** Bottom nav approximate height — keep nav panel above it */
const BOTTOM_NAV_H = 64;
/** Consider arrived when within this many meters */
const ARRIVAL_RADIUS_M = 80;

function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function getMinPrice(stationId: string, services: Service[]): number | null {
  const prices: number[] = [];
  for (const svc of services) {
    if (svc.station_ids.includes(stationId)) {
      for (const cat of Object.values(svc.categories)) {
        if (typeof cat.price === "number") prices.push(cat.price);
      }
    }
  }
  return prices.length > 0 ? Math.min(...prices) : null;
}

function getStationServiceNames(stationId: string, services: Service[]): string[] {
  return services
    .filter((s) => s.station_ids.includes(stationId))
    .map((s) => s.name);
}

function getCardChips(item: Station, services: Service[]): string[] {
  if (item.station_type === "HEV") {
    const types = (item.connectors || [])
      .map((c) => c.type)
      .filter((t): t is string => !!t);
    return Array.from(new Set(types));
  }
  return getStationServiceNames(item.id, services);
}

function getPriceLabel(item: Station, services: Service[]): string {
  if (item.station_type === "HEV") {
    const kws = (item.connectors || [])
      .map((c) => c.kw)
      .filter((k): k is number => typeof k === "number");
    return kws.length > 0 ? `up to ${Math.max(...kws)} kW` : "HEV charging";
  }
  const minPrice = getMinPrice(item.id, services);
  return minPrice != null ? `from Rs ${minPrice}` : "No services";
}

function mapServiceToCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("wash")) return "Car Wash";
  if (lower.includes("oil") || lower.includes("change")) return "Oil Change";
  if (lower.includes("tire") || lower.includes("tyre")) return "Tire Care";
  if (lower.includes("detail")) return "Detailing";
  if (lower.includes("battery")) return "Battery";
  return name;
}

async function fetchRoute(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): Promise<NavRoute> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not get route");
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error("No route found");
  }

  const route = data.routes[0];
  const coords: [number, number][] = route.geometry.coordinates.map(
    (c: [number, number]) => [c[1], c[0]]
  );

  const steps: RouteStep[] = [];
  for (const leg of route.legs || []) {
    for (const step of leg.steps || []) {
      const man = step.maneuver || {};
      const type = man.type || "";
      const modifier = man.modifier || "";
      let instruction = step.name
        ? `${type} ${modifier} onto ${step.name}`.trim()
        : `${type} ${modifier}`.trim();
      if (!instruction || instruction === " ") instruction = "Continue";
      instruction = instruction
        .replace(/^depart\s*/i, "Start")
        .replace(/^arrive\s*/i, "Arrive")
        .replace(/^turn\s+/i, "Turn ")
        .replace(/^new name\s*/i, "Continue on ");
      steps.push({
        instruction: instruction.charAt(0).toUpperCase() + instruction.slice(1),
        distance: step.distance || 0,
        duration: step.duration || 0,
        name: step.name,
      });
    }
  }

  return {
    coords,
    distance: route.distance,
    duration: route.duration,
    steps,
  };
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<React.ElementRef<typeof MapView>>(null);

  const [category, setCategory] = useState<Category>("SERVICE");
  const [uiCategory, setUiCategory] = useState<Category>("SERVICE");
  const [stationsByCat, setStationsByCat] = useState<Record<Category, Station[]>>({
    SERVICE: [],
    HEV: [],
  });
  const [loadingByCat, setLoadingByCat] = useState<Record<Category, boolean>>({
    SERVICE: true,
    HEV: true,
  });
  const [errorByCat, setErrorByCat] = useState<Record<Category, string>>({
    SERVICE: "",
    HEV: "",
  });
  const [services, setServices] = useState<Service[]>([]);

  const stations = stationsByCat[category];
  const loading = loadingByCat[category];
  const error = errorByCat[category];

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const switchingRef = useRef(false);
  const [segWidth, setSegWidth] = useState(0);
  const segHalf = Math.max(segWidth - 6, 0) / 2;

  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const DEMO_CENTER = useMemo(
    () =>
      stations.length > 0
        ? { latitude: stations[0].latitude, longitude: stations[0].longitude }
        : { latitude: 33.6844, longitude: 73.0479 },
    [stations]
  );

  const [region, setRegion] = useState<Region>({
    latitude: 33.6844,
    longitude: 73.0479,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  // ── Navigation state ──────────────────────────────────────────────
  const [navigating, setNavigating] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [navRoute, setNavRoute] = useState<NavRoute | null>(null);
  const [navError, setNavError] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [navDestination, setNavDestination] = useState<Station | null>(null);

  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [locationFilter, setLocationFilter] = useState<string>("Near me");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortKey>("nearest");

  const [draftLocation, setDraftLocation] = useState(locationFilter);
  const [draftServices, setDraftServices] = useState<string[]>([]);
  const [draftRating, setDraftRating] = useState(0);
  const [draftSort, setDraftSort] = useState<SortKey>("nearest");

  // Space reserved under content so it sits above Bottomnav
  const bottomChrome = BOTTOM_NAV_H + Math.max(insets.bottom, 8);

  // ── Load stations + services ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadCategory = async (cat: Category) => {
      try {
        const type = cat === "HEV" ? "HEV" : "EV";
        const res = await fetch(
          `${API_BASE}/stations/public?limit=50&station_type=${type}`
        );
        if (!res.ok) throw new Error("Failed to load stations");
        const data = await res.json();
        if (cancelled) return;
        setStationsByCat((prev) => ({ ...prev, [cat]: data.stations || [] }));
      } catch (e: any) {
        if (!cancelled) {
          setErrorByCat((prev) => ({
            ...prev,
            [cat]: e.message || "Failed to load data",
          }));
        }
      } finally {
        if (!cancelled) setLoadingByCat((prev) => ({ ...prev, [cat]: false }));
      }
    };

    const loadServices = async () => {
      try {
        const res = await fetch(`${API_BASE}/services/public`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setServices(data.services || []);
      } catch {
        // optional
      }
    };

    loadCategory("SERVICE");
    loadCategory("HEV");
    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Location watch ────────────────────────────────────────────────
  useEffect(() => {
    let watchId: Location.LocationSubscription;
    let cancelled = false;

    const startWatching = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        watchId = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 8,
          },
          (loc) => {
            if (cancelled) return;
            const coords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setUserCoords(coords);
            mapRef.current?.setUserLocation?.(coords.latitude, coords.longitude);
          }
        );
      } catch (e) {
        console.warn("Location watch failed:", e);
      }
    };

    startWatching();
    return () => {
      cancelled = true;
      if (watchId) watchId.remove();
    };
  }, []);

  useEffect(() => {
    if (userCoords) {
      mapRef.current?.setUserLocationEnabled?.(true);
    }
  }, [userCoords]);

  // ── Arrival detection: close nav + reopen station sheet ───────────
  useEffect(() => {
    if (!navigating || !navDestination || !userCoords) return;

    const distM = distanceKm(userCoords, navDestination) * 1000;
    if (distM <= ARRIVAL_RADIUS_M) {
      // Arrived — stop navigation, clear route, sheet will show again
      setNavigating(false);
      setNavRoute(null);
      setNavError("");
      setActiveStepIndex(0);
      setNavDestination(null);
      mapRef.current?.clearRoute?.();
      // Keep station selected so the card is highlighted
      setSelectedId(navDestination.id);
    }
  }, [userCoords, navigating, navDestination]);

  const origin = userCoords ?? DEMO_CENTER;

  const cityOptions = useMemo(() => {
    const cities = new Set(stations.map((s) => s.city).filter(Boolean));
    return ["Near me", ...Array.from(cities)];
  }, [stations]);

  const serviceOptions = useMemo(() => {
    const names = new Set(services.map((s) => s.name));
    const mapped = new Set<string>();
    names.forEach((n) => mapped.add(mapServiceToCategory(n)));
    return Array.from(mapped);
  }, [services]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = stations.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (locationFilter !== "Near me" && s.city !== locationFilter) return false;
      if (minRating > 0 && s.avg_rating < minRating) return false;
      if (selectedServices.length > 0) {
        const stationSvcNames = getStationServiceNames(s.id, services).map((n) =>
          mapServiceToCategory(n)
        );
        if (!selectedServices.every((svc) => stationSvcNames.includes(svc)))
          return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.avg_rating - a.avg_rating;
        case "price_asc":
          return (
            (getMinPrice(a.id, services) ?? Infinity) -
            (getMinPrice(b.id, services) ?? Infinity)
          );
        case "price_desc":
          return (
            (getMinPrice(b.id, services) ?? 0) -
            (getMinPrice(a.id, services) ?? 0)
          );
        case "popular":
          return b.booking_count - a.booking_count;
        case "nearest":
        default:
          return distanceKm(origin, a) - distanceKm(origin, b);
      }
    });
    return list;
  }, [
    stations,
    services,
    searchQuery,
    locationFilter,
    selectedServices,
    minRating,
    sortBy,
    origin,
  ]);

  const activeFilterCount =
    (locationFilter !== "Near me" ? 1 : 0) +
    (selectedServices.length > 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (sortBy !== "nearest" ? 1 : 0) +
    (searchQuery.trim().length > 0 ? 1 : 0);

  const switchCategory = useCallback(
    (next: Category) => {
      if (next === category || switchingRef.current) return;
      switchingRef.current = true;
      setUiCategory(next);

      Animated.timing(indicatorX, {
        toValue: next === "HEV" ? 1 : 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }).start(() => {
        setCategory(next);
        setSelectedId(null);
        setLocationFilter("Near me");
        setSelectedServices([]);
        // leave navigation if switching category
        if (navigating) {
          setNavigating(false);
          setNavRoute(null);
          setNavDestination(null);
          mapRef.current?.clearRoute?.();
        }
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 230,
          useNativeDriver: true,
        }).start(() => {
          switchingRef.current = false;
        });
      });
    },
    [category, contentOpacity, indicatorX, navigating]
  );

  // ── Navigation helpers ────────────────────────────────────────────
  const runNavigation = async (
    from: { latitude: number; longitude: number },
    station: Station
  ) => {
    setNavLoading(true);
    setNavError("");
    setNavigating(true);
    setActiveStepIndex(0);
    setNavDestination(station);
    try {
      const route = await fetchRoute(from, {
        latitude: station.latitude,
        longitude: station.longitude,
      });
      setNavRoute(route);
      mapRef.current?.showRoute?.(route.coords);
    } catch (e: any) {
      setNavError(e?.message || "Failed to get directions");
      setNavigating(false);
      setNavRoute(null);
      setNavDestination(null);
    } finally {
      setNavLoading(false);
    }
  };

  const startDirections = useCallback(
    async (station: Station) => {
      if (!userCoords) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setNavError("Location permission needed for directions");
            setNavigating(true); // so error panel shows
            return;
          }
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setUserCoords(coords);
          await runNavigation(coords, station);
        } catch {
          setNavError("Could not get your location");
          setNavigating(true);
        }
        return;
      }
      await runNavigation(userCoords, station);
    },
    [userCoords]
  );

  const stopNavigation = useCallback(() => {
    setNavigating(false);
    setNavRoute(null);
    setNavError("");
    setActiveStepIndex(0);
    setNavDestination(null);
    mapRef.current?.clearRoute?.();
  }, []);

  const locateMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserCoords(coords);
      const next: Region = {
        ...coords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(next);
      mapRef.current?.animateToRegion(next, 400);
    } catch {}
  };

  const focusStation = (station: Station) => {
    setSelectedId(station.id);
    const next: Region = {
      latitude: station.latitude,
      longitude: station.longitude,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 350);
  };

  const openFilters = useCallback(() => {
    setDraftLocation(locationFilter);
    setDraftServices([...selectedServices]);
    setDraftRating(minRating);
    setDraftSort(sortBy);
    setFiltersOpen(true);
  }, [locationFilter, selectedServices, minRating, sortBy]);

  const applyFilters = useCallback(() => {
    setLocationFilter(draftLocation);
    setSelectedServices([...draftServices]);
    setMinRating(draftRating);
    setSortBy(draftSort);
    setFiltersOpen(false);
  }, [draftLocation, draftServices, draftRating, draftSort]);

  const clearDraftFilters = useCallback(() => {
    setDraftLocation("Near me");
    setDraftServices([]);
    setDraftRating(0);
    setDraftSort("nearest");
  }, []);

  const toggleDraftService = useCallback((svc: string) => {
    setDraftServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  }, []);

  const renderStationCard = ({ item }: { item: Station }) => {
    const selected = item.id === selectedId;
    const km = distanceKm(origin, item);
    const chips = getCardChips(item, services);
    const isPopular = item.booking_count >= 5;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          setSelectedId(item.id);
          if (viewMode === "map") focusStation(item);
        }}
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.cardMeta}>
              {item.city || "Unknown"} · {km.toFixed(1)} km
            </Text>
          </View>
          {isPopular ? (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Popular</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="star" size={14} color="#F5A623" />
          <Text style={styles.cardStat}>
            {(item.avg_rating ?? 0).toFixed(1)} ({item.rating_count ?? 0})
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.cardPrice}>{getPriceLabel(item, services)}</Text>
        </View>
        <View style={styles.serviceRow}>
          {chips.slice(0, 3).map((svc) => (
            <View key={svc} style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>{svc}</Text>
            </View>
          ))}
          {chips.length > 3 ? (
            <Text style={styles.moreServices}>+{chips.length - 3}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderListRow = ({ item }: { item: Station }) => {
    const km = distanceKm(origin, item);
    const chips = getCardChips(item, services);
    const isPopular = item.booking_count >= 5;
    return (
      <Pressable
        style={styles.row}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/Home/stationdetail",
            params: {
              station_id: item.id,
              station_data: JSON.stringify(item),
            },
          })
        }
      >
        <View style={styles.rowAvatarWrap}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.rowAvatar} />
          ) : (
            <View style={styles.rowAvatarFallback}>
              <Ionicons
                name={item.station_type === "HEV" ? "flash" : "car-sport-outline"}
                size={24}
                color="#fff"
              />
            </View>
          )}
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowName} numberOfLines={1}>
              {item.name}
            </Text>
            {isPopular ? (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Popular</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.rowAddress} numberOfLines={1}>
            {[item.address, item.city].filter(Boolean).join(", ") || "Unknown"} ·{" "}
            {km.toFixed(1)} km
          </Text>
          <View style={styles.rowBottom}>
            <View style={styles.rowChips}>
              {chips.slice(0, 2).map((svc) => (
                <View key={svc} style={styles.rowChip}>
                  <Text style={styles.rowChipText}>{svc}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.rowPrice}>{getPriceLabel(item, services)}</Text>
          </View>
        </View>
        <View style={styles.rowRight}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#1d8cf8" />
            <Text style={styles.ratingText}>
              {(item.avg_rating ?? 0).toFixed(1)}
            </Text>
          </View>
          <Text style={styles.ratingCount}>({item.rating_count ?? 0})</Text>
          <Ionicons name="chevron-forward" size={16} color="#CCC" />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/Home/home")}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <View style={styles.searchFake}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilters}>
          <Ionicons name="options-outline" size={20} color="#111" />
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View
        style={styles.catRow}
        onLayout={(e) => setSegWidth(e.nativeEvent.layout.width)}
      >
        {segHalf > 0 ? (
          <Animated.View
            style={[
              styles.catIndicator,
              {
                width: segHalf,
                transform: [
                  {
                    translateX: indicatorX.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, segHalf],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : null}
        {CATEGORY_OPTIONS.map((opt) => {
          const active = uiCategory === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={styles.catBtn}
              activeOpacity={0.8}
              onPress={() => switchCategory(opt.key)}
            >
              <MaterialIcons
                name={opt.icon}
                size={16}
                color={active ? "#fff" : "#0f3c5c"}
              />
              <Text style={[styles.catText, active && styles.catTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === "map" && styles.toggleBtnOn]}
          onPress={() => setViewMode("map")}
        >
          <Ionicons
            name="map-outline"
            size={16}
            color={viewMode === "map" ? "#fff" : "#333"}
          />
          <Text
            style={[styles.toggleText, viewMode === "map" && styles.toggleTextOn]}
          >
            Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnOn]}
          onPress={() => {
            if (navigating) stopNavigation();
            setViewMode("list");
          }}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={viewMode === "list" ? "#fff" : "#333"}
          />
          <Text
            style={[
              styles.toggleText,
              viewMode === "list" && styles.toggleTextOn,
            ]}
          >
            List
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === "map" ? (
        <View style={styles.mapContainer}>
          {Platform.OS === "web" ? (
            <View style={styles.webMapFallback}>
              <Ionicons name="map-outline" size={40} color="#999" />
              <Text style={styles.webMapText}>
                Map requires iOS / Android. Use List mode on web.
              </Text>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              region={region}
              onRegionChangeComplete={setRegion}
              showsUserLocation={!!userCoords}
              showsMyLocationButton={false}
              markers={filtered.map((s) => ({
                id: s.id,
                latitude: s.latitude,
                longitude: s.longitude,
                onPress: () => focusStation(s),
                selected: s.id === selectedId,
                popular: s.booking_count >= 5,
                title: s.name,
                image_url: s.image_url,
              }))}
            />
          )}

          {/* Locate me — sits above sheets */}
          <TouchableOpacity
            style={[
              styles.locateBtn,
              {
                bottom: navigating
                  ? bottomChrome + Math.min(SCREEN_H * 0.28, 220)
                  : bottomChrome + Math.min(SCREEN_H * 0.32, 260),
              },
            ]}
            onPress={locateMe}
          >
            <Ionicons name="locate" size={22} color="#111" />
          </TouchableOpacity>

          {/* Get Directions — only when a station is selected and NOT navigating */}
          {selectedId && !navigating ? (
            <TouchableOpacity
              style={[
                styles.directionsBtn,
                {
                  bottom: bottomChrome + Math.min(SCREEN_H * 0.32, 260) + 56,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => {
                const station = filtered.find((s) => s.id === selectedId);
                if (station) startDirections(station);
              }}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.directionsBtnText}>
                {navLoading ? "Getting route..." : "Get Directions"}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Station cards sheet — HIDDEN while navigating */}
          {!navigating ? (
            <Animated.View
              style={[
                styles.sheet,
                {
                  paddingBottom: bottomChrome + 12,
                  maxHeight: SCREEN_H * 0.38,
                  opacity: contentOpacity,
                },
              ]}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>
                {filtered.length}{" "}
                {category === "HEV" ? "HEV station" : "service station"}
                {filtered.length === 1 ? "" : "s"} nearby
              </Text>
              {filtered.length === 0 ? (
                <Text style={styles.emptyText}>
                  {loading
                    ? "Loading stations..."
                    : "No stations match. Open filters and clear some options."}
                </Text>
              ) : (
                <FlatList
                  data={filtered}
                  keyExtractor={(item) => item.id}
                  renderItem={renderStationCard}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
                />
              )}
            </Animated.View>
          ) : null}

          {/* Navigation panel — ABOVE bottom nav */}
          {navigating ? (
            <View
              style={[
                styles.navPanel,
                {
                  bottom: bottomChrome,
                  maxHeight: Math.min(SCREEN_H * 0.32, 240),
                  paddingBottom: 12,
                },
              ]}
            >
              {navLoading ? (
                <View style={styles.navLoadingRow}>
                  <ActivityIndicator color="#FF7A00" />
                  <Text style={styles.navLoadingText}>Calculating route...</Text>
                </View>
              ) : navError ? (
                <View style={styles.navLoadingRow}>
                  <Text style={[styles.navLoadingText, { color: "#e74c3c", flex: 1 }]}>
                    {navError}
                  </Text>
                  <TouchableOpacity onPress={stopNavigation}>
                    <Text style={styles.navCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : navRoute ? (
                <>
                  <View style={styles.navHeader}>
                    <View>
                      <Text style={styles.navDistance}>
                        {(navRoute.distance / 1000).toFixed(1)} km
                      </Text>
                      <Text style={styles.navEta}>
                        {Math.round(navRoute.duration / 60)} min
                        {navDestination ? ` · ${navDestination.name}` : ""}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.navExitBtn}
                      onPress={stopNavigation}
                    >
                      <Ionicons name="close" size={18} color="#fff" />
                      <Text style={styles.navExitText}>Exit</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 6 }}
                  >
                    {navRoute.steps.map((step, i) => (
                      <View
                        key={i}
                        style={[
                          styles.navStepCard,
                          { width: Math.min(SCREEN_W * 0.42, 170) },
                          i === activeStepIndex && styles.navStepCardActive,
                        ]}
                      >
                        <Text style={styles.navStepIndex}>{i + 1}</Text>
                        <Text style={styles.navStepText} numberOfLines={2}>
                          {step.instruction}
                        </Text>
                        <Text style={styles.navStepDist}>
                          {step.distance >= 1000
                            ? `${(step.distance / 1000).toFixed(1)} km`
                            : `${Math.round(step.distance)} m`}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderListRow}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            ListHeaderComponent={
              <Text style={styles.stationSectionTitle}>
                {CATEGORY_TITLE[category]}
              </Text>
            }
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: bottomChrome + 16,
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {loading
                  ? "Loading stations..."
                  : error
                    ? error
                    : "No stations match. Open filters and clear some options."}
              </Text>
            }
          />
        </Animated.View>
      )}

      {loading ? (
        <View style={styles.loadingBanner}>
          <ActivityIndicator color="#FF7A00" size="small" />
          <Text style={styles.loadingBannerText}>Loading stations...</Text>
        </View>
      ) : null}
      {!loading && error ? (
        <View style={styles.loadingBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#e74c3c" />
          <Text style={[styles.loadingBannerText, { color: "#e74c3c" }]}>
            {error}
          </Text>
        </View>
      ) : null}

      <Modal
        visible={filtersOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setFiltersOpen(false)}
        />
        <View
          style={[
            styles.modalSheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters & sort</Text>
            <TouchableOpacity onPress={clearDraftFilters}>
              <Text style={styles.clearText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Sort by</Text>
            <View style={styles.wrapChips}>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <Chip
                  key={key}
                  label={SORT_LABELS[key]}
                  active={draftSort === key}
                  onPress={() => setDraftSort(key)}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Location / area</Text>
            <View style={styles.wrapChips}>
              {cityOptions.map((loc) => (
                <Chip
                  key={loc}
                  label={loc}
                  active={draftLocation === loc}
                  onPress={() => setDraftLocation(loc)}
                  icon={loc === "Near me" ? "navigate-outline" : undefined}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Minimum rating</Text>
            <View style={styles.wrapChips}>
              {RATING_OPTIONS.map((r) => (
                <Chip
                  key={String(r)}
                  label={r === 0 ? "Any" : `${r}+`}
                  active={draftRating === r}
                  onPress={() => setDraftRating(r)}
                  icon={r > 0 ? "star" : undefined}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>
              Services (all selected must match)
            </Text>
            <View style={styles.wrapChips}>
              {serviceOptions.map((svc) => (
                <Chip
                  key={svc}
                  label={svc}
                  active={draftServices.includes(svc)}
                  onPress={() => toggleDraftService(svc)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setFiltersOpen(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Show results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Bottomnav />
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={active ? "#fff" : "#0f3c5c"}
          style={{ marginRight: 4 }}
        />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const BRAND = "#1d8cf8";
const BRAND_DARK = "#1d8cf8";
const POPULAR = "#1d8cf8";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  stationSectionTitle: {
    backgroundColor: "#ffffff",
    color: "#222",
    fontSize: 17,
    fontWeight: "700",
    paddingBottom: 8,
    paddingTop: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  searchFake: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  catRow: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#e2edf5",
    borderRadius: 14,
    padding: 3,
  },
  catIndicator: {
    position: "absolute",
    top: 3,
    left: 3,
    bottom: 3,
    borderRadius: 11,
    backgroundColor: BRAND_DARK,
  },
  catBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  catText: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_DARK,
  },
  catTextActive: {
    color: "#fff",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  chipActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  chipText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#e2edf5",
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleBtnOn: {
    backgroundColor: BRAND_DARK,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  toggleTextOn: {
    color: "#fff",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  webMapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#E8EEF0",
  },
  webMapText: {
    marginTop: 12,
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
  locateBtn: {
    position: "absolute",
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 20,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 8,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    zIndex: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  card: {
    width: Math.min(SCREEN_W * 0.68, 260),
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#EEE",
  },
  cardSelected: {
    borderColor: BRAND,
    backgroundColor: "#F0FDFA",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  rowAvatarWrap: {
    width: 55,
    height: 55,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  rowAvatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
  },
  rowAvatarFallback: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
  },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    flexShrink: 1,
  },
  rowAddress: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 6,
  },
  rowChips: {
    flexDirection: "row",
    gap: 4,
    flexShrink: 1,
  },
  rowChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rowChipText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
  },
  rowPrice: {
    fontSize: 12,
    color: BRAND_DARK,
    fontWeight: "700",
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
  ratingCount: {
    fontSize: 10,
    color: "#999",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  cardMeta: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  popularBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: POPULAR,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  cardStat: {
    fontSize: 12,
    color: "#444",
    fontWeight: "600",
  },
  dot: {
    color: "#BBB",
    marginHorizontal: 2,
  },
  cardPrice: {
    fontSize: 12,
    color: BRAND_DARK,
    fontWeight: "700",
  },
  serviceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 8,
    alignItems: "center",
  },
  serviceChip: {
    backgroundColor: "#E7F5F3",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceChipText: {
    fontSize: 10,
    color: BRAND_DARK,
    fontWeight: "600",
  },
  moreServices: {
    fontSize: 10,
    color: "#888",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    padding: 24,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_H * 0.78,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  clearText: {
    color: BRAND,
    fontWeight: "700",
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    marginTop: 14,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  wrapChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
  },
  cancelBtnText: {
    fontWeight: "700",
    color: "#444",
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BRAND,
    alignItems: "center",
  },
  applyBtnText: {
    fontWeight: "800",
    color: "#fff",
  },
  loadingBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 8,
    zIndex: 100,
  },
  loadingBannerText: {
    color: "#888",
    fontSize: 13,
  },

  // Directions floating button
  directionsBtn: {
    position: "absolute",
    alignSelf: "center",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRAND,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 25,
  },
  directionsBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  // Navigation panel (above Bottomnav)
  navPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 30,
  },
  navLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  navLoadingText: {
    fontSize: 14,
    color: "#333",
  },
  navCloseText: {
    color: BRAND,
    fontWeight: "700",
    fontSize: 14,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  navDistance: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },
  navEta: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
    maxWidth: SCREEN_W * 0.55,
  },
  navExitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1d8cf8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navExitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  navStepCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 10,
  },
  navStepCardActive: {
    backgroundColor: "#FFF3E8",
    borderWidth: 1,
    borderColor: BRAND,
  },
  navStepIndex: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND,
    marginBottom: 4,
  },
  navStepText: {
    fontSize: 13,
    color: "#222",
    fontWeight: "500",
  },
  navStepDist: {
    fontSize: 11,
    color: "#888",
    marginTop: 6,
  },
});