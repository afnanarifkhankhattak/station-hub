import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import Bottomnav from "@/components/Bottomnav";

const APP_VERSION = "1.0.0";

const FEATURES = [
  {
    icon: <Feather name="search" size={18} color="#FF7A45" />,
    title: "Discover Services",
    description: "Browse Basic and Premium car wash and detailing services near you.",
  },
  {
    icon: <Feather name="calendar" size={18} color="#FF7A45" />,
    title: "Easy Booking",
    description: "Pick a station, date, and time slot, then confirm in just a few taps.",
  },
  {
    icon: <Feather name="clipboard" size={18} color="#FF7A45" />,
    title: "My Booking",
    description: "View and manage your upcoming, completed, and cancelled bookings.",
  },
  {
    icon: <Feather name="clock" size={18} color="#FF7A45" />,
    title: "Booking History",
    description: "View all your past and upcoming bookings in one place.",
  },
];

export default function AboutAppScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP GRADIENT */}
      <LinearGradient
        colors={["#FFE4DA", "#FFF4EC", "#FFFFFF"]}
        style={styles.gradient}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>About App</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* LOGO + NAME CARD */}
        <View style={styles.logoCard}>
          <Image
            source={require("../../../../assets/images/Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Station Hub</Text>
          <Text style={styles.versionText}>Version {APP_VERSION}</Text>
        </View>

        {/* DESCRIPTION CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What is Station Hub?</Text>
          <Text style={styles.paragraph}>
            Station Hub makes it simple to find, book, and manage car wash and detailing
            services nearby. Whether you're looking for a quick basic wash or a full
            premium detail, you can browse available services, pick a convenient station,
            and schedule an appointment, all from one app.{"\n\n"}
            Built with car owners in mind, Station Hub takes the guesswork out of finding a
            reliable car care service, so you can spend less time searching and more time
            on the road.
          </Text>
        </View>

        {/* FEATURES CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What you can do</Text>

          {FEATURES.map((feature, index) => (
            <View
              key={feature.title}
              style={[
                styles.featureRow,
                index === FEATURES.length - 1 && { marginBottom: 0 },
              ]}
            >
              <View style={styles.featureIcon}>{feature.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footerText}>
          © {new Date().getFullYear()} Station Hub. All rights reserved.
        </Text>
      </ScrollView>

      <Bottomnav />
    </SafeAreaView>
  );
}

/* ====================== STYLES ====================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  gradient: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 220,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 20,
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  logoCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },

  logo: {
    width: 70,
    height: 70,
    marginBottom: 12,
  },

  appName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  versionText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 10,
  },

  paragraph: {
    fontSize: 13.5,
    lineHeight: 21,
    color: "#4B5563",
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  featureIcon: {
    width: 36,
    height: 36,
    backgroundColor: "#FFF1EB",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },

  featureDescription: {
    fontSize: 12.5,
    color: "#6B7280",
    lineHeight: 18,
  },

  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
});
