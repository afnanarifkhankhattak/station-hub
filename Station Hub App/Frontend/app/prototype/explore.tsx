/**
 * PROTOTYPE ONLY — Station Explore / Map Discovery
 *
 * Isolated screen. Does not modify or link from any tab/home/profile.
 * Open in dev by navigating to: /prototype/explore
 * Example: router.push("/prototype/explore") from a temporary console, or
 * Expo URL: exp://<host>/--/prototype/explore
 *
 * Safe to delete this entire file (and app/prototype/) later.
 */
import React, { useMemo, useRef, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";

// ─── Mock data (prototype only — not wired to API) ───────────────────────────

const SERVICE_OPTIONS = [
  "Car Wash",
  "Oil Change",
  "Tire Care",
  "Detailing",
  "Battery",
] as const;

const LOCATION_OPTIONS = [
  "Near me",
  "Downtown",
  "Riverside",
  "Airport Road",
  "Mall Area",
] as const;

type MockStation = {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  minPrice: number;
  popular: boolean;
  services: string[];
};

/** Dummy stations clustered around a Lahore-ish demo center */
const DEMO_CENTER = { latitude: 31.5204, longitude: 74.3587 };

const MOCK_STATIONS: MockStation[] = [
  {
    id: "s1",
    name: "Station Hub Riverside",
    area: "Riverside",
    latitude: 31.5221,
    longitude: 74.3512,
    rating: 4.8,
    reviewCount: 214,
    minPrice: 800,
    popular: true,
    services: ["Car Wash", "Detailing", "Tire Care"],
  },
  {
    id: "s2",
    name: "QuickClean Express",
    area: "Downtown",
    latitude: 31.5158,
    longitude: 74.342,
    rating: 4.3,
    reviewCount: 98,
    minPrice: 500,
    popular: true,
    services: ["Car Wash", "Oil Change"],
  },
  {
    id: "s3",
    name: "Aero Auto Care",
    area: "Airport Road",
    latitude: 31.531,
    longitude: 74.4035,
    rating: 4.6,
    reviewCount: 156,
    minPrice: 1200,
    popular: false,
    services: ["Oil Change", "Battery", "Tire Care"],
  },
  {
    id: "s4",
    name: "Mall Sparkle Wash",
    area: "Mall Area",
    latitude: 31.5102,
    longitude: 74.3655,
    rating: 3.9,
    reviewCount: 42,
    minPrice: 400,
    popular: false,
    services: ["Car Wash"],
  },
  {
    id: "s5",
    name: "Premium Detailing Co.",
    area: "Downtown",
    latitude: 31.5189,
    longitude: 74.3488,
    rating: 4.9,
    reviewCount: 301,
    minPrice: 2500,
    popular: true,
    services: ["Detailing", "Car Wash", "Oil Change"],
  },
  {
    id: "s6",
    name: "Budget Lube Point",
    area: "Riverside",
    latitude: 31.5265,
    longitude: 74.3601,
    rating: 3.5,
    reviewCount: 27,
    minPrice: 350,
    popular: false,
    services: ["Oil Change", "Battery"],
  },
  {
    id: "s7",
    name: "City Tire & Wash",
    area: "Mall Area",
    latitude: 31.5055,
    longitude: 74.372,
    rating: 4.1,
    reviewCount: 73,
    minPrice: 600,
    popular: false,
    services: ["Tire Care", "Car Wash", "Battery"],
  },
  {
    id: "s8",
    name: "Airport Pro Station",
    area: "Airport Road",
    latitude: 31.5288,
    longitude: 74.395,
    rating: 4.4,
    reviewCount: 119,
    minPrice: 900,
    popular: true,
    services: ["Car Wash", "Oil Change", "Detailing", "Tire Care"],
  },
];

type SortKey = "nearest" | "rating" | "price_asc" | "price_desc" | "popular";

const SORT_LABELS: Record<SortKey, string> = {
  nearest: "Nearest",
  rating: "Top rated",
  price_asc: "Price: low → high",
  price_desc: "Price: high → low",
  popular: "Popular",
};

const RATING_OPTIONS = [0, 3.5, 4.0, 4.5] as const;

const { height: SCREEN_H } = Dimensions.get("window");

// ─── Haversine (km) for “nearest” sort ───────────────────────────────────────

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

// ─── Custom pin (view-based, no shared assets) ───────────────────────────────

function StationPin({ selected, popular }: { selected: boolean; popular?: boolean }) {
  return (
    <View style={styles.pinWrap}>
      <View
        style={[
          styles.pinBody,
          selected && styles.pinBodySelected,
          popular && !selected && styles.pinBodyPopular,
        ]}
      >
        <Ionicons
          name="water"
          size={selected ? 16 : 14}
          color="#fff"
        />
      </View>
      <View
        style={[
          styles.pinTip,
          selected && styles.pinTipSelected,
          popular && !selected && styles.pinTipPopular,
        ]}
      />
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function PrototypeExploreScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);

  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [region, setRegion] = useState<Region>({
    ...DEMO_CENTER,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Draft vs applied so modal can Cancel
  const [locationFilter, setLocationFilter] = useState<string>("Near me");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortKey>("nearest");

  const [draftLocation, setDraftLocation] = useState(locationFilter);
  const [draftServices, setDraftServices] = useState<string[]>([]);
  const [draftRating, setDraftRating] = useState(0);
  const [draftSort, setDraftSort] = useState<SortKey>("nearest");

  const openFilters = () => {
    setDraftLocation(locationFilter);
    setDraftServices([...selectedServices]);
    setDraftRating(minRating);
    setDraftSort(sortBy);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setLocationFilter(draftLocation);
    setSelectedServices([...draftServices]);
    setMinRating(draftRating);
    setSortBy(draftSort);
    setFiltersOpen(false);
  };

  const clearDraftFilters = () => {
    setDraftLocation("Near me");
    setDraftServices([]);
    setDraftRating(0);
    setDraftSort("nearest");
  };

  const activeFilterCount =
    (locationFilter !== "Near me" ? 1 : 0) +
    (selectedServices.length > 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (sortBy !== "nearest" ? 1 : 0);

  const origin = userCoords ?? DEMO_CENTER;

  const filtered = useMemo(() => {
    let list = MOCK_STATIONS.filter((s) => {
      if (locationFilter !== "Near me" && s.area !== locationFilter) return false;
      if (minRating > 0 && s.rating < minRating) return false;
      if (
        selectedServices.length > 0 &&
        !selectedServices.every((svc) => s.services.includes(svc))
      ) {
        return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "price_asc":
          return a.minPrice - b.minPrice;
        case "price_desc":
          return b.minPrice - a.minPrice;
        case "popular":
          return Number(b.popular) - Number(a.popular) || b.reviewCount - a.reviewCount;
        case "nearest":
        default:
          return distanceKm(origin, a) - distanceKm(origin, b);
      }
    });

    return list;
  }, [locationFilter, selectedServices, minRating, sortBy, origin]);

  const locateMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // Prototype: stay on demo center
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
      const next: Region = {
        ...coords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(next);
      mapRef.current?.animateToRegion(next, 400);
    } catch {
      /* prototype: ignore */
    }
  };

  const focusStation = (station: MockStation) => {
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

  const toggleDraftService = (svc: string) => {
    setDraftServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  };

  const renderStationCard = ({ item }: { item: MockStation }) => {
    const selected = item.id === selectedId;
    const km = distanceKm(origin, item);
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
              {item.area} · {km.toFixed(1)} km
            </Text>
          </View>
          {item.popular ? (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Popular</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="star" size={14} color="#F5A623" />
          <Text style={styles.cardStat}>
            {item.rating.toFixed(1)} ({item.reviewCount})
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.cardPrice}>from Rs {item.minPrice}</Text>
        </View>
        <View style={styles.serviceRow}>
          {item.services.slice(0, 3).map((svc) => (
            <View key={svc} style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>{svc}</Text>
            </View>
          ))}
          {item.services.length > 3 ? (
            <Text style={styles.moreServices}>+{item.services.length - 3}</Text>
          ) : null}
        </View>
        <Text style={styles.prototypeHint}>Prototype — no booking link</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Banner so it's obvious this is isolated */}
      <View style={styles.protoBanner}>
        <Ionicons name="flask-outline" size={14} color="#5B21B6" />
        <Text style={styles.protoBannerText}>
          PROTOTYPE · /prototype/explore · not linked to tabs
        </Text>
      </View>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.searchFake}>
          <Ionicons name="search" size={18} color="#888" />
          <Text style={styles.searchPlaceholder}>Search stations (mock)</Text>
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

      {/* Map / List toggle */}
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
                Map prototype is for iOS / Android. Use List mode on web.
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
            >
              {filtered.map((s) => (
                <Marker
                  key={s.id}
                  coordinate={{
                    latitude: s.latitude,
                    longitude: s.longitude,
                  }}
                  onPress={() => focusStation(s)}
                  tracksViewChanges={false}
                >
                  <StationPin
                    selected={s.id === selectedId}
                    popular={s.popular}
                  />
                </Marker>
              ))}
            </MapView>
          )}

          <TouchableOpacity style={styles.locateBtn} onPress={locateMe}>
            <Ionicons name="locate" size={22} color="#111" />
          </TouchableOpacity>

          {/* Bottom sheet list */}
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {filtered.length} station{filtered.length === 1 ? "" : "s"} nearby
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
            paddingBottom: insets.bottom + 24,
            gap: 10,
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No stations match. Open filters and clear some options.
            </Text>
          }
        />
      )}

      {/* Filters modal */}
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
              {LOCATION_OPTIONS.map((loc) => (
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

            <Text style={styles.sectionLabel}>Services (all selected must match)</Text>
            <View style={styles.wrapChips}>
              {SERVICE_OPTIONS.map((svc) => (
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
    </View>
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
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const BRAND = "#0D9488";
const BRAND_DARK = "#0F766E";
const POPULAR = "#D97706";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  protoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  protoBannerText: {
    fontSize: 11,
    color: "#5B21B6",
    fontWeight: "600",
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
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  searchPlaceholder: {
    color: "#999",
    fontSize: 14,
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
  chipScroll: {
    maxHeight: 44,
    marginTop: 8,
  },
  chipRow: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
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
  prototypeHint: {
    marginTop: 8,
    fontSize: 10,
    color: "#AAA",
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    padding: 24,
    fontSize: 14,
  },
  pinWrap: {
    alignItems: "center",
  },
  pinBody: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  pinBodySelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0F766E",
    borderWidth: 3,
  },
  pinBodyPopular: {
    backgroundColor: POPULAR,
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: BRAND,
    marginTop: -1,
  },
  pinTipSelected: {
    borderTopColor: "#0F766E",
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
  },
  pinTipPopular: {
    borderTopColor: POPULAR,
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
});
