import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import { API_BASE } from "@/src/config";
import { apiFetch } from "@/src/api";

type Category = "PETROL" | "HEV";
type SortKey = "newest" | "rated" | "nearest" | "popular";

const PAGE_SIZE = 20;
const INITIAL_VISIBLE = 5;
const MIN_TOP_RATED_STARS = 4;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;
const DEFAULT_RADIUS_KM = 10;

const CATEGORY_OPTIONS: { key: Category; label: string }[] = [
  { key: "PETROL", label: "Petrol Pump Services" },
  { key: "HEV", label: "HEV Charging" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "rated", label: "Top Rated" },
  { key: "nearest", label: "Nearest" },
  { key: "popular", label: "Popular" },
];

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// Straight-line (great-circle) distance in km — good enough for "how far away
// is this station", not turn-by-turn driving distance.
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Props = {
  // Controlled from Home's own search bar. Empty string = normal category view.
  searchQuery?: string;
  // Home / explore.tsx pass their own ScrollView ref here so tapping a
  // category can scroll the page up to the "Explore Stations" heading.
  scrollRef?: React.RefObject<ScrollView>;
};

export default function ExploreStation({ searchQuery = "", scrollRef }: Props) {
  const router = useRouter();

  const [category, setCategory] = useState<Category>("PETROL");
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const isSearchMode = searchQuery.trim().length > 0;

  // ---- Nearest tab: live location + adjustable radius ----
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

  const categoryRef = useRef(category);
  categoryRef.current = category;

  const headingYRef = useRef(0);

  // ---------------- category list fetching ----------------
  // Returns the page's cursor/hasMore so "Show more" / Nearest can chain
  // requests without racing the component's own state.
  const fetchCategoryPage = useCallback(
    async (cursor: string | null, cat: Category): Promise<{ nextCursor: string | null; hasMore: boolean }> => {
      const cacheKey = `explore_stations_${cat.toLowerCase()}`;
      if (!cursor) {
        setLoading(true);
        const cached = await AsyncStorage.getItem(cacheKey);
        if (categoryRef.current === cat && cached) setStations(JSON.parse(cached));
      }
      setError("");
      try {
        const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (cat === "HEV") query.set("station_type", "HEV");
        if (cursor) query.set("cursor", cursor);

        const res = await apiFetch(`${API_BASE}/stations/public?${query.toString()}`);
        const data = await res.json();
        if (categoryRef.current !== cat) return { nextCursor: null, hasMore: false };

        if (res.ok) {
          let fetched = data.stations || [];
          if (cat === "PETROL") {
            // Legacy stations have no station_type field — treat those as petrol
            // pump stations, only hide ones explicitly marked HEV.
            fetched = fetched.filter((s: any) => (s.station_type || "EV") !== "HEV");
          }
          if (!cursor) {
            setStations(fetched);
            AsyncStorage.setItem(cacheKey, JSON.stringify(fetched));
          } else {
            setStations((prev) => [...prev, ...fetched]);
          }
          const nc = data.next_cursor || null;
          const hm = Boolean(data.next_cursor);
          setNextCursor(nc);
          setHasMore(hm);
          return { nextCursor: nc, hasMore: hm };
        } else {
          setError(data.detail || "Failed to load stations");
          return { nextCursor: null, hasMore: false };
        }
      } catch (e) {
        if (categoryRef.current === cat) setError("Cannot connect to server");
        return { nextCursor: null, hasMore: false };
      } finally {
        if (categoryRef.current === cat) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setStations([]);
    setNextCursor(null);
    setHasMore(true);
    setVisibleCount(INITIAL_VISIBLE);
    fetchCategoryPage(null, category);
  }, [category, fetchCategoryPage]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [sortBy]);

  // Keep paging until the server has nothing left, then reveal everything.
  const loadAllPages = useCallback(async () => {
    let cursor = nextCursor;
    let more = hasMore;
    while (more && cursor) {
      const result = await fetchCategoryPage(cursor, category);
      cursor = result.nextCursor;
      more = result.hasMore;
    }
  }, [nextCursor, hasMore, fetchCategoryPage, category]);

  // ---------------- Nearest: ask for location, then load the full dataset ----------------
  const requestLocation = useCallback(async () => {
    setRequestingLocation(true);
    setLocationError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission was not granted.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch (e) {
      setLocationError("Could not get your current location.");
    } finally {
      setRequestingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (sortBy !== "nearest") return;
    if (!userLocation && !requestingLocation) requestLocation();
  }, [sortBy, userLocation, requestingLocation, requestLocation]);

  useEffect(() => {
    // Radius search needs the whole category, not just the first page —
    // load everything once the user's location is known.
    if (sortBy === "nearest" && userLocation) {
      setLoadingMore(true);
      loadAllPages().finally(() => {
        setVisibleCount(Number.MAX_SAFE_INTEGER);
        setLoadingMore(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, userLocation, category]);

  // ---------------- search (driven entirely by the prop from Home) ----------------
  useEffect(() => {
    let cancelled = false;
    if (!isSearchMode) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    (async () => {
      setSearching(true);
      try {
        const res = await apiFetch(
          `${API_BASE}/stations/public/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        const data = await res.json();
        if (!cancelled && res.ok) setSearchResults(data.stations || []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, isSearchMode]);

  // ---------------- sorting / filtering (client-side, on the loaded category list) ----------------
  const sortedStations = useMemo(() => {
    let list = [...stations];

    if (sortBy === "newest") {
      list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    } else if (sortBy === "rated") {
      // Real filter: only 4 stars and up appear here at all.
      list = list.filter((s) => Number(s.avg_rating || 0) >= MIN_TOP_RATED_STARS);
      list.sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0));
    } else if (sortBy === "popular") {
      // Only stations that have actually been rated show here — no "New"
      // placeholders — highest star rating first, most-booked breaks ties.
      list = list.filter((s) => Number(s.avg_rating || 0) > 0);
      list.sort((a, b) => {
        const ratingDiff = Number(b.avg_rating || 0) - Number(a.avg_rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.booking_count || 0) - (a.booking_count || 0);
      });
    } else if (sortBy === "nearest") {
      if (!userLocation) {
        list = [];
      } else {
        list = list
          .filter((s) => typeof s.latitude === "number" && typeof s.longitude === "number")
          .map((s) => ({
            ...s,
            _distanceKm: distanceKm(userLocation.latitude, userLocation.longitude, s.latitude, s.longitude),
          }))
          .filter((s) => s._distanceKm <= radiusKm)
          .sort((a, b) => a._distanceKm - b._distanceKm);
      }
    }
    return list;
  }, [stations, sortBy, userLocation, radiusKm]);

  const visibleStations = sortedStations.slice(0, visibleCount);
  const canShowMore =
    sortBy !== "nearest" && (visibleCount < sortedStations.length || hasMore);

//   const handleShowMore = async () => {
//     if (loadingMore) return;
//     setLoadingMore(true);
//     await loadAllPages();
//     setVisibleCount(Number.MAX_SAFE_INTEGER);
//     setLoadingMore(false);
//   };

const handleShowMore = async () => {
  if (loadingMore) return;
  setLoadingMore(true);
  await loadAllPages();
  setVisibleCount(Number.MAX_SAFE_INTEGER);
  setLoadingMore(false);

  // Smoothly scroll down a bit to frame the newly revealed items nicely
  scrollRef?.current?.scrollTo({
    y: headingYRef.current + 150, // Adjust offset as needed
    animated: true,
  });
};

  const handleCategoryPress = (key: Category) => {
    setCategory(key);
    // Bring the "Explore Stations" heading to the top of the screen.
    scrollRef?.current?.scrollTo({ y: Math.max(headingYRef.current - 10, 0), animated: true });
  };

  const openStation = (station: any) => {
    router.push({
      pathname: "/(tabs)/Home/stationdetail",
      params: { station_id: station.id, station_data: JSON.stringify(station) },
    });
  };

  const renderStationCard = (station: any) => {
    const locationLabel = [station.address, station.city].filter(Boolean).join(", ");
    const isHev = station.station_type === "HEV";
    const hasRating = Number(station.avg_rating || 0) > 0;
    const showNewLabel = sortBy === "newest" && !hasRating; // "New" only ever appears on the Newest tab

    return (
      <TouchableOpacity style={styles.serviceCard} onPress={() => openStation(station)}>
        {station.image_url ? (
          <Image source={{ uri: station.image_url }} style={styles.serviceImage} />
        ) : (
          <Image source={require("@/assets/images/service1.png")} style={styles.serviceImage} />
        )}
        <View style={{ flex: 1 }}>
          {isHev && (
            <View style={styles.hevBadge}>
              <Text style={styles.hevBadgeText}>⚡ HEV</Text>
            </View>
          )}
          <Text style={styles.serviceTitle}>{station.name}</Text>
          {locationLabel ? <Text style={styles.serviceLocation}>{locationLabel}</Text> : null}

          <View style={styles.ratingRow}>
            {hasRating ? (
              <>
                <Text style={styles.ratingText}>{Number(station.avg_rating).toFixed(1)}</Text>
                <Text style={styles.ratingStar}>★</Text>
                {station.rating_count > 0 && (
                  <Text style={styles.ratingCountText}> ({station.rating_count})</Text>
                )}
              </>
            ) : showNewLabel ? (
              <Text style={styles.ratingText}>New</Text>
            ) : null}

            {sortBy === "nearest" && typeof station._distanceKm === "number" && (
              <Text style={styles.distanceText}>
                {(hasRating || showNewLabel) && "  •  "}
                {station._distanceKm < 1
                  ? `${Math.round(station._distanceKm * 1000)} m away`
                  : `${station._distanceKm.toFixed(1)} km away`}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const StationSkeleton = () => (
    <View style={styles.serviceCard}>
      <View style={[styles.serviceImage, { backgroundColor: "#e0e0e0" }]} />
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ width: "70%", height: 16, backgroundColor: "#e0e0e0", borderRadius: 4, marginBottom: 8 }} />
        <View style={{ width: "90%", height: 12, backgroundColor: "#e0e0e0", borderRadius: 4, marginBottom: 8 }} />
        <View style={{ width: "40%", height: 12, backgroundColor: "#e0e0e0", borderRadius: 4 }} />
      </View>
    </View>
  );

  const emptyMessage = () => {
    if (sortBy === "rated") {
      return category === "HEV"
        ? "No HEV stations rated 4★ or higher yet"
        : "No stations rated 4★ or higher yet";
    }
    if (sortBy === "popular") {
      return category === "HEV"
        ? "No rated HEV stations yet"
        : "No rated stations yet";
    }
    if (sortBy === "nearest") {
      return `No ${category === "HEV" ? "HEV " : ""}stations within ${radiusKm} km`;
    }
    return category === "HEV" ? "No HEV stations found" : "No stations found";
  };

  const SearchBarRating = () => null; // placeholder kept for clarity of section boundaries

  // ---------------- SEARCH MODE (text comes from Home) ----------------
  if (isSearchMode) {
    return (
      <View>
        <Text style={styles.heading}>Results for "{searchQuery}"</Text>
        {searching ? (
          <ActivityIndicator size="small" color="#FF7A45" style={{ marginVertical: 20 }} />
        ) : searchResults.length === 0 ? (
          <Text style={styles.emptyMsg}>No stations found</Text>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            renderItem={({ item }) => renderStationCard(item)}
            scrollEnabled={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews
          />
        )}
      </View>
    );
  }

  // ---------------- CATEGORY MODE ----------------
  return (
    <View>
      <Text
        style={styles.heading}
        onLayout={(e) => {
          headingYRef.current = e.nativeEvent.layout.y;
        }}
      >
        Explore Stations
      </Text>

      {/* CATEGORIES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {CATEGORY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.categoryTab, category === opt.key && styles.categoryTabActive]}
            onPress={() => handleCategoryPress(opt.key)}
          >
            <MaterialIcons
              name={opt.key === "HEV" ? "ev-station" : "local-gas-station"}
              size={16}
              color={category === opt.key ? "#fff" : "#FF7A45"}
            />
            <Text style={[styles.categoryTabText, category === opt.key && styles.categoryTabTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* SORT TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortBtn, sortBy === opt.key && styles.sortBtnActive]}
            onPress={() => setSortBy(opt.key)}
          >
            <Text style={[styles.sortBtnText, sortBy === opt.key && styles.sortBtnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* NEAREST: location prompt or radius slider */}
      {sortBy === "nearest" && !userLocation && (
        <View style={styles.locationPrompt}>
          <Ionicons name="location-outline" size={26} color="#FF7A45" />
          <Text style={styles.locationPromptText}>
            Turn on your location to find {category === "HEV" ? "HEV" : "petrol pump"} stations near you
          </Text>
          {locationError ? <Text style={styles.locationErrorText}>{locationError}</Text> : null}
          <TouchableOpacity style={styles.locationBtn} onPress={requestLocation} disabled={requestingLocation}>
            {requestingLocation ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.locationBtnText}>Use my location</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {sortBy === "nearest" && userLocation && (
        <View style={styles.radiusRow}>
          <Text style={styles.radiusLabel}>Within {radiusKm} km</Text>
          <Slider
            style={{ width: "100%", height: 36 }}
            minimumValue={MIN_RADIUS_KM}
            maximumValue={MAX_RADIUS_KM}
            step={1}
            value={radiusKm}
            minimumTrackTintColor="#FF7A45"
            maximumTrackTintColor="#FFD9C2"
            thumbTintColor="#FF7A45"
            onValueChange={setRadiusKm}
          />
        </View>
      )}

      {error ? <Text style={styles.emptyMsg}>{error}</Text> : null}

      {(loading || (sortBy === "nearest" && loadingMore)) && stations.length === 0 ? (
        <View>
          <StationSkeleton />
          <StationSkeleton />
          <StationSkeleton />
        </View>
      ) : sortBy === "nearest" && !userLocation ? null : visibleStations.length === 0 ? (
        <Text style={styles.emptyMsg}>{emptyMessage()}</Text>
      ) : (
        <FlatList
          data={visibleStations}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={({ item }) => renderStationCard(item)}
          scrollEnabled={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          ListFooterComponent={
            canShowMore ? (
              <TouchableOpacity style={styles.showMoreBtn} onPress={handleShowMore} disabled={loadingMore}>
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#FF7A45" />
                ) : (
                  <Text style={styles.showMoreText}>Show more</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: "bold", marginTop: 10, marginLeft: 15, marginBottom: 10 },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFF1E8",
    marginLeft: 15,
  },
  categoryTabActive: { backgroundColor: "#FF7A45" },
  categoryTabText: { fontSize: 13, fontWeight: "700", color: "#FF7A45", marginLeft: 6 },
  categoryTabTextActive: { color: "#fff" },
  sortBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFF1E8",
    marginLeft: 15,
  },
  sortBtnActive: { backgroundColor: "#FF7A45" },
  sortBtnText: { fontSize: 13, fontWeight: "600", color: "#FF7A45" },
  sortBtnTextActive: { color: "#fff" },
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
  serviceImage: { width: 70, height: 70, borderRadius: 15, marginRight: 12 },
  serviceTitle: { fontSize: 15, fontWeight: "bold" },
  serviceLocation: { fontSize: 12, color: "#888", marginTop: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  ratingText: { fontSize: 13, fontWeight: "600", color: "#444", marginRight: 4 },
  ratingStar: { fontSize: 13, color: "#FFB400" },
  ratingCountText: { fontSize: 11, color: "#999" },
  distanceText: { fontSize: 12, color: "#FF7A45", fontWeight: "600" },
  hevBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#16A34A",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  hevBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  showMoreBtn: {
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFF1E8",
  },
  showMoreText: { color: "#FF7A45", fontWeight: "700", fontSize: 13 },
  emptyMsg: { textAlign: "center", color: "#888", marginTop: 20, marginHorizontal: 18 },
  locationPrompt: {
    alignItems: "center",
    backgroundColor: "#FFF1E8",
    marginHorizontal: 15,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  locationPromptText: {
    textAlign: "center",
    color: "#555",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 12,
  },
  locationErrorText: { color: "#D14343", fontSize: 12, marginBottom: 10 },
  locationBtn: {
    backgroundColor: "#FF7A45",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  locationBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  radiusRow: { marginHorizontal: 18, marginBottom: 12 },
  radiusLabel: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 2 },
});