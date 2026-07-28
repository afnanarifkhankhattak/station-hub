import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView from "../components/Map";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChooseLocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [region, setRegion] = useState({
    latitude: 33.6844,
    longitude: 73.0479,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  const [cityName, setCityName] = useState<string>("");

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission denied!");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(coords);

      // ← update map region to center on user
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      
      // reverse geocode
      const [place] = await Location.reverseGeocodeAsync(coords);
      const parts = [
        place?.name,
        place?.street,
        place?.district,
        place?.subregion,
        place?.city,
      ].filter(Boolean);
      const fullAddress = parts.join(", ") || "Unknown";
      setCityName(fullAddress);
    } catch (error) {
      alert("Could not get location");
    }
  };

  const handleConfirmLocation = async () => {
    if (cityName) {
      await AsyncStorage.setItem("user_city", cityName);
    }
    router.replace("/(tabs)/Home/home");
  };

  return (
    <View style={styles.container}>
      {/* MAP */}
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
      />

      {/* LOCATION BUTTON */}
      <TouchableOpacity style={[styles.button, { top: insets.top + 10 }]} onPress={getLocation}>
        <Ionicons name="location-sharp" size={18} color="#fff" />
        <Text style={styles.buttonText}>Use Current Location</Text>
      </TouchableOpacity>

      {/* BOTTOM SHEET */}
      <View style={styles.bottomSheet}>
        <Text style={styles.title}>Confirm Location</Text>

        <Text style={styles.address}>
          {cityName
            ? cityName
            : location
              ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
              : "Getting your location..."}
        </Text>

        <Text style={styles.subTitle}>Nearby Stations</Text>

        <Text style={styles.item}>• Riverside Detailing</Text>

        <Text style={styles.item}>• Brookside Car Care</Text>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirmLocation}
        >
          <Text style={styles.confirmText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  button: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#ff7a00",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 100,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },

  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: "50%",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  address: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },

  subTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 8,
  },

  item: {
    fontSize: 12,
    color: "#333",
    marginBottom: 5,
  },

  confirmBtn: {
    backgroundColor: "#ff7a00",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },

  confirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
