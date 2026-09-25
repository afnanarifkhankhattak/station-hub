import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const getServiceIcon = (name: string): any => {
  const n = name.toLowerCase();
  if (n.includes("express") || n.includes("wash")) return "car-outline";
  if (n.includes("premium") || n.includes("detail")) return "ribbon-outline";
  if (n.includes("interior")) return "color-fill-outline";
  if (n.includes("engine")) return "cog-outline";
  if (n.includes("wax")) return "shield-checkmark-outline";
  if (n.includes("tyre") || n.includes("tire")) return "ellipse-outline";
  if (n.includes("maintain") || n.includes("maintenance"))
    return "construct-outline";
  return "sparkles-outline";
};

type Props = {
  description?: string;
  services: any[];
  loadingServices: boolean;
  onSchedule: (service: any) => void;
};

export default function About({
  description,
  services,
  loadingServices,
  onSchedule,
}: Props) {
  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.accentBar} />
        <Text style={styles.title}>About</Text>
      </View>

      {/* Description */}
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : (
        <Text style={styles.descriptionMuted}>
          No description available for this station.
        </Text>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Offered Services */}
      <Text style={styles.sectionLabel}>Offered services</Text>

      {loadingServices ? (
        <ActivityIndicator
          size="small"
          color="#F97316"
          style={{ marginVertical: 24 }}
        />
      ) : services.length === 0 ? (
        <Text style={styles.emptyText}>
          No services available at this station yet.
        </Text>
      ) : (
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <View key={service.id} style={styles.serviceChip}>
              <View style={styles.serviceIconWrap}>
                <Ionicons
                  name={getServiceIcon(service.name)}
                  size={20}
                  color="#F97316"
                />
              </View>
              <Text style={styles.serviceName} numberOfLines={2}>
                {service.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Gallery */}
      <Text style={[styles.sectionLabel, { marginTop: 22 }]}>Gallery</Text>
      <View style={styles.gallery}>
        <Image
          source={require("@/assets/images/interior_car.webp")}
          style={styles.galleryMain}
        />
        <View style={styles.gallerySide}>
          <Image
            source={require("@/assets/images/detailing.jpg")}
            style={styles.galleryThumb}
          />
          <Image
            source={require("@/assets/images/washing_image.jpg")}
            style={styles.galleryThumb}
          />
        </View>
      </View>

      {/* CTA */}
      {services.length > 0 && (
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() => onSchedule(services[0])}
        >
          <Text style={styles.ctaText}>Schedule a service</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    // soft elevation
    shadowColor: "#1B2A41",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  accentBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: "#F97316",
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B2A41",
    letterSpacing: 0.2,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4A5568",
  },
  descriptionMuted: {
    fontSize: 14,
    lineHeight: 22,
    color: "#A0AEC0",
    fontStyle: "italic",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E8ECF0",
    marginVertical: 18,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 13,
    color: "#A0AEC0",
    fontStyle: "italic",
  },

  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  serviceChip: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF5ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  serviceName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3748",
    lineHeight: 18,
  },

  gallery: {
    flexDirection: "row",
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
  },
  galleryMain: {
    flex: 1.6,
    height: "100%",
    borderRadius: 14,
  },
  gallerySide: {
    flex: 1,
    marginLeft: 8,
    justifyContent: "space-between",
  },
  galleryThumb: {
    height: 76,
    width: "100%",
    borderRadius: 12,
  },

  ctaBtn: {
    marginTop: 22,
    backgroundColor: "#F97316",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});