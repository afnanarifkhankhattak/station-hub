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
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Bottomnav from "@/components/Bottomnav";
import { useUser } from "../../../context/userContext";
import { useHardwareDoubleBackToExit } from "@/hooks/useHardwareDoubleBackToExit";


export default function ProfileSettingsScreen() {
  useHardwareDoubleBackToExit();
  const router = useRouter();
  const { user, loading } = useUser();
  
  /* ================= DATA ================= */

  const generalItems = [
    {
  id: 1,
  title: "Manage your profile",
  subtitle: "Change profile picture, name, number & mail",
  icon: <Feather name="user" size={20} color="#FF7A45" />,
  route: "/(tabs)/profile/manageProfile/manageprofile",
},
    {
      id: 2,
      title: "Bookings",
      subtitle: "View past bookings",
      icon: <Feather name="clock" size={20} color="#FF7A45" />,
      route: "/(tabs)/profile/bookingHistory/bookinghistory",
    },
    {
      id: 3,
      title: "Change Password",
      subtitle: "Update your account password",
      icon: <Feather name="lock" size={20} color="#FF7A45" />,
      route: "/(tabs)/profile/changePassword/changepassword",
    },
  ];

  const settingsItems = [
    {
      id: 1,
      title: "Privacy Policy",
      subtitle: "How we handle your data",
      icon: <Feather name="shield" size={20} color="#FF7A45" />,
      route: "/(tabs)/profile/privacyPolicy/privacypolicy",
    },
    {
      id: 2,
      title: "FAQs",
      subtitle: "Frequently asked questions",
      icon: <Feather name="help-circle" size={20} color="#FF7A45" />,
      route: "/(tabs)/profile/faqs/faqs",
    },
    {
      id: 3,
      title: "About App",
      subtitle: "App version & information",
      icon: <Feather name="info" size={20} color="#FF7A45" />,
      route: "/(tabs)/profile/aboutApp/aboutapp",
    },
  ];

  /* ================= RENDER ITEM (FIXED) ================= */

  const renderItem = (item: any) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.itemCard}
        activeOpacity={0.8}
        onPress={() => router.push(item.route)}
      >
        <View style={styles.iconContainer}>
          {item.icon}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.itemTitle}>
            {item.title}
          </Text>
          <Text style={styles.itemSubtitle}>
            {item.subtitle}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#9CA3AF"
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* GRADIENT */}
      <LinearGradient
        colors={["#FFE4DA", "#FFF5F0", "#FFFFFF"]}
        style={styles.gradient}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>

          <Image
            source={user?.profile_image ? { uri: user.profile_image } : require("../../../assets/images/johndoe.png")}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        </View>

        {/* PROFILE CARD */}
        <TouchableOpacity style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <Image
source={user?.profile_image ? { uri: user.profile_image } : require("../../../assets/images/johndoe.png")}              style={styles.avatar}
            />

            <View>
              <Text style={styles.profileName}>
                {user?.full_name}
              </Text>
              <Text style={styles.profileEmail}>
                {user?.email}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* GENERAL */}
        <Text style={styles.sectionTitle}>
          General
        </Text>
        {generalItems.map(renderItem)}

        {/* SETTINGS */}
        <Text style={styles.sectionTitle}>
          Settings
        </Text>
        {settingsItems.map(renderItem)}

        {/* LOGOUT */}
        <TouchableOpacity
                    style={[styles.menuItem, styles.logoutItem]}
                    onPress={() => router.push("/(tabs)/profile/logout/logout")}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#FF0000" />
                    <View style={styles.menuText}>
                      <Text style={[styles.menuTitle, { color: "#FF0000" }]}>Logout</Text>
                      <Text style={styles.menuSubtitle}>Sign out of your account</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
      </ScrollView>

      <Bottomnav />
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
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
    marginVertical: 20,
    paddingHorizontal: 18,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },

  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    marginRight: 12,
  },

  profileName: {
    fontWeight: "700",
    fontSize: 16,
  },

  profileEmail: {
    color: "#6B7280",
    fontSize: 13,
  },

  sectionTitle: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 10,
    color: "#9CA3AF",
    fontWeight: "600",
  },

  itemCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#FFF1EB",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  textContainer: {
    flex: 1,
    marginLeft: 12,
  },

  itemTitle: {
    fontWeight: "600",
  },

  itemSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },

  logoutCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  logoutLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoutTitle: {
    color: "#EF4444",
    fontWeight: "700",
  },

  logoutItem: {
    marginTop: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ffcccc",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  logoutSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },

  menuText: {
    marginLeft: 16,
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  menuSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 3,
  },
});


