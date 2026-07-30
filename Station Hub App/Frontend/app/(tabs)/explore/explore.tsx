import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Pressable,
  Platform,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView from "@/components/Map";
import type { Region } from "@/components/Map";
import * as Location from "expo-location";
import Bottomnav from "@/components/Bottomnav";
import { API_BASE } from "../../../src/config";

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



type SortKey = "nearest" | "rating" | "price_asc" | "price_desc" | "popular";

const SORT_LABELS: Record<SortKey, string> = {
  nearest: "Nearest",
  rating: "Top rated",
  price_asc: "Price: low \u2192 high",
  price_desc: "Price: high \u2192 low",
  popular: "Popular",
};

const RATING_OPTIONS = [0, 3.5, 4.0, 4.5] as const;

const { height: SCREEN_H } = Dimensions.get("window");

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

function getStationServiceNames(
  stationId: string,
  services: Service[]
): string[] {
  return services
    .filter((s) => s.station_ids.includes(stationId))
    .map((s) => s.name);
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

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<React.ElementRef<typeof MapView>>(null);

  const [stations, setStations] = useState<Station[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const DEMO_CENTER = useMemo(
    () =>
      stations.length > 0
        ? {
            latitude: stations[0].latitude,
            longitude: stations[0].longitude,
          }
        : { latitude: 33.6844, longitude: 73.0479 },
    [stations]
  );

  const [region, setRegion] = useState<Region>({
    latitude: 33.6844,
    longitude: 73.0479,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [stRes, svcRes] = await Promise.all([
          fetch(`${API_BASE}/stations/public`),
          fetch(`${API_BASE}/services/public`),
        ]);
        if (!stRes.ok) throw new Error("Failed to load stations");
        if (!svcRes.ok) throw new Error("Failed to load services");
        const stData = await stRes.json();
        const svcData = await svcRes.json();
        if (cancelled) return;
        setStations(stData.stations || []);
        setServices(svcData.services || []);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Auto-request location on mount and watch for updates
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
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (loc) => {
            if (cancelled) return;
            const coords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setUserCoords(coords);
            // Update the blue dot on map via new imperative method
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
      if (watchId) {
        watchId.remove();
      }
    };
  }, []);

  // Enable user location dot on map when we have coordinates
  useEffect(() => {
    if (userCoords) {
      mapRef.current?.setUserLocationEnabled?.(true);
    }
  }, [userCoords]);

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
        const stationSvcNames = getStationServiceNames(s.id, services).map(
          (n) => mapServiceToCategory(n)
        );
        if (
          !selectedServices.every((svc) => stationSvcNames.includes(svc))
        )
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
  }, [stations, services, searchQuery, locationFilter, selectedServices, minRating, sortBy, origin]);

  const activeFilterCount =
    (locationFilter !== "Near me" ? 1 : 0) +
    (selectedServices.length > 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (sortBy !== "nearest" ? 1 : 0) +
    (searchQuery.trim().length > 0 ? 1 : 0);

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
    const minPrice = getMinPrice(item.id, services);
    const stationSvcNames = getStationServiceNames(item.id, services);
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
          <Text style={styles.cardPrice}>
            {minPrice != null ? `from Rs ${minPrice}` : "No services"}
          </Text>
        </View>
        <View style={styles.serviceRow}>
          {stationSvcNames.slice(0, 3).map((svc) => (
            <View key={svc} style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>{svc}</Text>
            </View>
          ))}
          {stationSvcNames.length > 3 ? (
            <Text style={styles.moreServices}>
              +{stationSvcNames.length - 3}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/Home/home")}>
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
          onPress={() => setViewMode("list")}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={viewMode === "list" ? "#fff" : "#333"}
          />
          <Text
            style={[styles.toggleText, viewMode === "list" && styles.toggleTextOn]}
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

          <TouchableOpacity style={styles.locateBtn} onPress={locateMe}>
            <Ionicons name="locate" size={22} color="#111" />
          </TouchableOpacity>

          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 12) + 80 },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {filtered.length} station
              {filtered.length === 1 ? "" : "s"} nearby
            </Text>
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>
                No stations match. Open filters and clear some options.
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
          </View>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderStationCard}
          contentContainerStyle={{
            padding: 12,
            paddingBottom: Math.max(insets.bottom, 12) + 80,
            gap: 10,
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
          <Text style={[styles.loadingBannerText, { color: "#e74c3c" }]}>{error}</Text>
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
          color={active ? "#fff" : "#333"}
          style={{ marginRight: 4 }}
        />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const BRAND = "#FF7A00";
const BRAND_DARK = "#FF7A45";
const POPULAR = "#D97706";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fffdfb",
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
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginRight: 0,
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
    backgroundColor: "#E8E8E8",
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
    bottom: SCREEN_H * 0.34,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
    maxHeight: SCREEN_H * 0.38,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
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
    width: 260,
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
});
