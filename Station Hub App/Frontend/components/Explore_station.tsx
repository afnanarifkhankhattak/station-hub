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
  useWindowDimensions,
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
const INITIAL_VISIBLE = 2;
const MIN_TOP_RATED_STARS = 4;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;
const DEFAULT_RADIUS_KM = 10;

const CATEGORY_OPTIONS: { key: Category; label: string }[] = [
  { key: "PETROL", label: "Services Stations" },
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
  searchQuery?: string;
  scrollRef?: React.RefObject<ScrollView | null>;
  scrollYRef?: { current: number };
};

export default function ExploreStation({
  searchQuery = "",
  scrollRef,
  scrollYRef,
}: Props) {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();

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

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

  const categoryRef = useRef(category);
  categoryRef.current = category;

  // Layout positions inside Home's ScrollView
  const sectionYRef = useRef(0);
  const headingYRef = useRef(0);
  const restoreYRef = useRef<number | null>(null);

  const scrollToHeading = useCallback(() => {
    const y = Math.max(sectionYRef.current + headingYRef.current - 8, 0);
    scrollRef?.current?.scrollTo({ y, animated: true });
  }, [scrollRef]);

  const fetchCategoryPage = useCallback(
    async (
      cursor: string | null,
      cat: Category
    ): Promise<{ nextCursor: string | null; hasMore: boolean }> => {
      const cacheKey = `explore_stations_${cat.toLowerCase()}`;
      if (!cursor) {
        setLoading(true);
        const cached = await AsyncStorage.getItem(cacheKey);
        if (categoryRef.current === cat && cached) {
          setStations(JSON.parse(cached));
        }
      }
      setError("");
      try {
        const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
        query.set("station_type", cat === "HEV" ? "HEV" : "EV");
        if (cursor) query.set("cursor", cursor);

        const res = await apiFetch(
          `${API_BASE}/stations/public?${query.toString()}`
        );
        const data = await res.json();
        if (categoryRef.current !== cat) {
          return { nextCursor: null, hasMore: false };
        }

        if (res.ok) {
          let fetched = data.stations || [];
          if (cat === "PETROL") {
            fetched = fetched.filter(
              (s: any) => (s.station_type || "EV") !== "HEV"
            );
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
      } catch {
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

  const loadAllPages = useCallback(async () => {
    let cursor = nextCursor;
    let more = hasMore;
    while (more && cursor) {
      const result = await fetchCategoryPage(cursor, category);
      cursor = result.nextCursor;
      more = result.hasMore;
    }
  }, [nextCursor, hasMore, fetchCategoryPage, category]);

  const requestLocation = useCallback(async () => {
    setRequestingLocation(true);
    setLocationError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission was not granted.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch {
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
    if (sortBy === "nearest" && userLocation) {
      setLoadingMore(true);
      loadAllPages().finally(() => {
        setVisibleCount(Number.MAX_SAFE_INTEGER);
        setLoadingMore(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, userLocation, category]);

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
          `${API_BASE}/stations/public/search?q=${encodeURIComponent(
            searchQuery.trim()
          )}`
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

  const sortedStations = useMemo(() => {
    let list = [...stations];

    if (sortBy === "newest") {
      list.sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      );
    } else if (sortBy === "rated") {
      list = list.filter(
        (s) => Number(s.avg_rating || 0) >= MIN_TOP_RATED_STARS
      );
      list.sort(
        (a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0)
      );
    } else if (sortBy === "popular") {
      list = list.filter((s) => Number(s.avg_rating || 0) > 0);
      list.sort((a, b) => {
        const ratingDiff =
          Number(b.avg_rating || 0) - Number(a.avg_rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.booking_count || 0) - (a.booking_count || 0);
      });
    } else if (sortBy === "nearest") {
      if (!userLocation) {
        list = [];
      } else {
        list = list
          .filter(
            (s) =>
              typeof s.latitude === "number" && typeof s.longitude === "number"
          )
          .map((s) => ({
            ...s,
            _distanceKm: distanceKm(
              userLocation.latitude,
              userLocation.longitude,
              s.latitude,
              s.longitude
            ),
          }))
          .filter((s) => s._distanceKm <= radiusKm)
          .sort((a, b) => a._distanceKm - b._distanceKm);
      }
    }
    return list;
  }, [stations, sortBy, userLocation, radiusKm]);

  const visibleStations = sortedStations.slice(0, visibleCount);
  const canShowMore =
    sortBy !== "nearest" &&
    (visibleCount < sortedStations.length || hasMore);

  // Show more → expand, then pin heading to top
  const handleShowMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    await loadAllPages();
    setVisibleCount(Number.MAX_SAFE_INTEGER);
    setLoadingMore(false);
    // slight delay so layout updates before scroll
    requestAnimationFrame(() => {
      scrollToHeading();
    });
  };

  // HEV → remember Y, scroll heading to top
  // Service Stations → restore previous Y
  const handleCategoryPress = (key: Category) => {
    if (key === category) return;
    setCategory(key);
    if (key === "HEV") {
      restoreYRef.current = scrollYRef?.current ?? 0;
      requestAnimationFrame(() => {
        scrollToHeading();
      });
    } else {
      const y = restoreYRef.current ?? 0;
      scrollRef?.current?.scrollTo({ y, animated: true });
      restoreYRef.current = null;
    }
  };

  const openStation = (station: any) => {
    router.push({
      pathname: "/(tabs)/Home/stationdetail",
      params: {
        station_id: station.id,
        station_data: JSON.stringify(station),
      },
    });
  };

  const renderStationCard = (station: any) => {
    const locationLabel = [station.address, station.city]
      .filter(Boolean)
      .join(", ");
    const isHev = station.station_type === "HEV";
    const hasRating = Number(station.avg_rating || 0) > 0;
    const showNewLabel = sortBy === "newest" && !hasRating;

    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => openStation(station)}
      >
        {station.image_url ? (
          <Image
            source={{ uri: station.image_url }}
            style={styles.serviceImage}
          />
        ) : (
          <Image
            source={require("@/assets/images/service1.png")}
            style={styles.serviceImage}
          />
        )}
        <View style={{ flex: 1 }}>
          {isHev && (
            <View style={styles.hevBadge}>
              <Text style={styles.hevBadgeText}>⚡ HEV</Text>
            </View>
          )}
          <Text style={styles.serviceTitle}>{station.name}</Text>
          {locationLabel ? (
            <Text style={styles.serviceLocation}>{locationLabel}</Text>
          ) : null}

          <View style={styles.ratingRow}>
            {hasRating ? (
              <>
                <Text style={styles.ratingText}>
                  {Number(station.avg_rating).toFixed(1)}
                </Text>
                <Text style={styles.ratingStar}>★</Text>
                {station.rating_count > 0 && (
                  <Text style={styles.ratingCountText}>
                    {" "}
                    ({station.rating_count})
                  </Text>
                )}
              </>
            ) : showNewLabel ? (
              <Text style={styles.ratingText}>New</Text>
            ) : null}

            {sortBy === "nearest" &&
              typeof station._distanceKm === "number" && (
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
        <View
          style={{
            width: "70%",
            height: 16,
            backgroundColor: "#e0e0e0",
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            width: "90%",
            height: 12,
            backgroundColor: "#e0e0e0",
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            width: "40%",
            height: 12,
            backgroundColor: "#e0e0e0",
            borderRadius: 4,
          }}
        />
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

  // ---------- SEARCH MODE ----------
  if (isSearchMode) {
    return (
      <View>
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>Results for "{searchQuery}"</Text>
        </View>
        {searching ? (
          <ActivityIndicator
            size="small"
            color="#FF7A45"
            style={{ marginVertical: 20 }}
          />
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

  // ---------- CATEGORY MODE ----------
  return (
  
  <View
    onLayout={(e) => {
      sectionYRef.current = e.nativeEvent.layout.y;
    }}
  >
      {/* Explore Stations — themed pill heading */}
      <View
        style={styles.headingWrap}
        onLayout={(e) => {
          headingYRef.current = e.nativeEvent.layout.y;
        }}
      >
        <Text style={styles.heading}>Explore Stations</Text>
      </View>

      {/* CATEGORIES */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 10 }}
      >
        {CATEGORY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.categoryTab,
              category === opt.key && styles.categoryTabActive,
            ]}
            onPress={() => handleCategoryPress(opt.key)}
          >
            <MaterialIcons
              name={opt.key === "HEV" ? "ev-station" : "local-gas-station"}
              size={16}
              color={category === opt.key ? "#fff" : "#FF7A45"}
            />
            <Text
              style={[
                styles.categoryTabText,
                category === opt.key && styles.categoryTabTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* SORT TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 10 }}
      >
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortBtn, sortBy === opt.key && styles.sortBtnActive]}
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

      {/* NEAREST: location / radius */}
      {sortBy === "nearest" && !userLocation && (
        <View style={styles.locationPrompt}>
          <Ionicons name="location-outline" size={26} color="#FF7A45" />
          <Text style={styles.locationPromptText}>
            Turn on your location to find{" "}
            {category === "HEV" ? "HEV" : "petrol pump"} stations near you
          </Text>
          {locationError ? (
            <Text style={styles.locationErrorText}>{locationError}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={requestLocation}
            disabled={requestingLocation}
          >
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

      {(loading || (sortBy === "nearest" && loadingMore)) &&
      stations.length === 0 ? (
        <View>
          <StationSkeleton />
          <StationSkeleton />
          <StationSkeleton />
        </View>
      ) : sortBy === "nearest" && !userLocation ? null : visibleStations.length ===
        0 ? (
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
              <TouchableOpacity
                style={styles.showMoreBtn}
                onPress={handleShowMore}
                disabled={loadingMore}
              >
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
  // Themed pill heading (matches Home)
  headingWrap: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF1E8",
    borderRadius: 16,
    marginTop: 10,
    marginLeft: 15,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF7A45",
  },

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
  categoryTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF7A45",
    marginLeft: 6,
  },
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
  serviceImage: {
    width: 70,
    height: 70,
    borderRadius: 15,
    marginRight: 12,
  },
  serviceTitle: { fontSize: 15, fontWeight: "bold" },
  serviceLocation: { fontSize: 12, color: "#888", marginTop: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginRight: 4,
  },
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

  emptyMsg: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    marginHorizontal: 18,
  },

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
  radiusLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginBottom: 2,
  },
});