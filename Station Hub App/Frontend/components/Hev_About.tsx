import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NOT_AVAILABLE = "Not available right now";

const getConnectorIcon = (type?: string): any => {
  const t = (type || "").toLowerCase();
  if (t.includes("ccs")) return "flash-outline";
  if (t.includes("chademo")) return "battery-charging-outline";
  if (t.includes("type 2") || t.includes("type2")) return "power-outline";
  return "help-circle-outline";
};

type Connector = {
  type?: string;
  kw?: number;
  count?: number;
  chargingType?: "AC" | "DC"; // not currently returned by the API — kept optional for when it is
};

type Station = {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  image_url?: string;
  opening?: string;
  closing?: string;
  connectors?: Connector[];
};

type Props = {
  station: Station;
  // Only the Nearest tab currently computes this — pass it through if you have it.
  distanceKm?: number;
};

export default function HevAbout({ station, distanceKm }: Props) {
  const hours =
    station.opening && station.closing ? `${station.opening} – ${station.closing}` : null;

  const connectors = station.connectors || [];

  return (
    <View style={styles.wrapper}>
      {/* Station name is already shown in the screen header above this card —
          this component starts straight at the type badge / distance line. */}
      <View style={styles.headerMetaRow}>
        <View style={styles.badge}>
          <Ionicons name="flash" size={13} color="#0f3c5c" />
          <Text style={styles.badgeText}>HEV Charging</Text>
        </View>
        <Text style={styles.mutedInline}>
          Verification: <Text style={styles.mutedInlineValue}>{NOT_AVAILABLE}</Text>
        </Text>
      </View>

     

      {/* GALLERY */}
      <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Gallery</Text>
      {station.image_url ? (
        <Image source={{ uri: station.image_url }} style={styles.galleryMain} />
      ) : (
        <View style={styles.galleryPlaceholder}>
          <Ionicons name="image-outline" size={26} color="#C7CFDA" />
          <Text style={styles.galleryPlaceholderText}>{NOT_AVAILABLE}</Text>
        </View>
      )}

      <View style={styles.divider} />

      {/* LOCATION */}
      <Text style={styles.sectionLabel}>Location</Text>
      <Text style={styles.description}>
        {[station.address, station.city].filter(Boolean).join(", ") || NOT_AVAILABLE}
      </Text>

      <View style={styles.divider} />

      {/* AVAILABILITY */}
      <Text style={styles.sectionLabel}>Availability</Text>
      <Text style={styles.description}>{hours || NOT_AVAILABLE}</Text>
      <Text style={styles.mutedInline}>
        Live status: <Text style={styles.mutedInlineValue}>{NOT_AVAILABLE}</Text>
      </Text>

      <View style={styles.divider} />

      {/* CHARGERS */}
      <Text style={styles.sectionLabel}>Chargers</Text>
      {connectors.length === 0 ? (
        <Text style={styles.emptyText}>No charger details available yet.</Text>
      ) : (
        connectors.map((c, i) => (
          <View key={i} style={styles.chargerCard}>
            <View style={styles.chargerIconWrap}>
              <Ionicons name={getConnectorIcon(c.type)} size={20} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.chargerType}>{c.type || NOT_AVAILABLE}</Text>
              <View style={styles.chargerSpecsRow}>
                <Text style={styles.chargerSpec}>
                  Charging Type: <Text style={styles.chargerSpecValue}>{c.chargingType || NOT_AVAILABLE}</Text>
                </Text>
              </View>
              <View style={styles.chargerSpecsRow}>
                <Text style={styles.chargerSpec}>
                  Power: <Text style={styles.chargerSpecValue}>{c.kw ? `${c.kw} kW` : NOT_AVAILABLE}</Text>
                </Text>
                <Text style={[styles.chargerSpec, { marginLeft: 14 }]}>
                  Quantity: <Text style={styles.chargerSpecValue}>{c.count ?? NOT_AVAILABLE}</Text>
                </Text>
              </View>
            </View>
          </View>
        ))
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
    shadowColor: "#1B2A41",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAFBF0",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#16A34A", marginLeft: 4 },

  mutedInline: { fontSize: 12, color: "#A0AEC0" },
  mutedInlineValue: { color: "#A0AEC0", fontStyle: "italic" },

  distanceText: { fontSize: 13, fontWeight: "600", color: "#F97316", marginTop: 4 },

  description: { fontSize: 14, lineHeight: 22, color: "#4A5568" },
  descriptionMuted: { fontSize: 13, color: "#A0AEC0", fontStyle: "italic", marginTop: 4 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E8ECF0", marginVertical: 18 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  emptyText: { fontSize: 13, color: "#A0AEC0", fontStyle: "italic" },

  galleryMain: { width: "100%", height: 160, borderRadius: 14 },
  galleryPlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryPlaceholderText: { fontSize: 12, color: "#A0AEC0", marginTop: 6, fontStyle: "italic" },

  chargerCard: {
    flexDirection: "row",
    backgroundColor: "#FAFBFC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  chargerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF5ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  chargerType: { fontSize: 14, fontWeight: "700", color: "#2D3748", marginBottom: 4 },
  chargerSpecsRow: { flexDirection: "row", marginTop: 2 },
  chargerSpec: { fontSize: 12, color: "#718096" },
  chargerSpecValue: { color: "#2D3748", fontWeight: "600" },
});