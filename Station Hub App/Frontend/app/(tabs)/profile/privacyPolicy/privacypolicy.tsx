import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { uiGoBack } from "@/utils/uiGoBack";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Bottomnav from "@/components/Bottomnav";
import { useUser } from "../../../../context/userContext"; // adjust relative path to match this file's depth
import { API_BASE } from "../../../../src/config"; // adjust relative path to match this file's depth
import { apiFetch } from "../../../../src/api";


export default function PrivacyPolicyScreen() {
  const { user, loading: userLoading, updateUser } = useUser();

  const [checked, setChecked] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  // reflect the user's saved agreement status whenever it loads/changes
  useEffect(() => {
    if (user) {
      setAgreed(!!user.agreed_to_privacy_policy);
      setChecked(!!user.agreed_to_privacy_policy);
    }
  }, [user]);

  const handleAgree = async () => {
    if (!checked) {
      Alert.alert("Please confirm", "You must check the box to agree to the Privacy Policy.");
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await apiFetch(`${API_BASE}/profile/privacy-agreement`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agreed: true }),
      });

      const data = await res.json();

      if (res.ok) {
        setAgreed(true);
        updateUser({ ...user, agreed_to_privacy_policy: true });
      } else {
        Alert.alert("Error", data.detail || "Failed to save your agreement.");
      }
    } catch (e) {
      Alert.alert("Error", "Cannot connect to server.");
    } finally {
      setSaving(false);
    }
  };

  if (userLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#1d8cf8" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP GRADIENT */}
      <LinearGradient
        colors={["#FFE4DA", "#FFF4EC", "#FFFFFF"]}
        style={styles.gradient}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={uiGoBack}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Privacy Policy</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.updatedText}>Last updated: June 2026</Text>

          <Text style={styles.paragraph}>
            At Station Hub, your trust matters to us. This Privacy Policy outlines what
            information we collect, why we collect it, and how it's used and protected
            while you book and manage car wash and detailing services through our app.
            By using Station Hub, you agree to the practices described below.{"\n\n"}
            We collect information you provide directly, such as your name, email address,
            phone number, and profile picture when you create an account. We also collect
            information generated through your use of the app, including booking history,
            vehicle details, and your approximate location when you
            choose to share it, so we can show you nearby stations and accurate service
            availability.{"\n\n"}
            Your information is used to create and manage your account, process bookings,
            send confirmations and reminders, improve our services, and respond to support
            requests. We may also use aggregated, non-identifying data to understand usage
            trends and improve the app's features and performance.{"\n\n"}
            We do not sell your personal information. We may share limited booking details
            with the specific station you book a service from, so they can prepare for your
            appointment. We may also share information with trusted service providers who
            help us operate the app, such as cloud hosting and payment processing, under
            confidentiality obligations.{"\n\n"}
            We use reasonable technical and organizational measures to protect your
            information from unauthorized access, alteration, or disclosure. However, no
            method of transmission or storage is completely secure, and we encourage you to
            use a strong, unique password for your account.{"\n\n"}
            You can review and update your profile information at any time from the app.
            You may also request deletion of your account and associated data by contacting
            our support team. Declining to share certain information, such as location, may
            limit some features of the app.{"\n\n"}
            Our app is not directed at children under the age of 13, and we do not knowingly
            collect personal information from children. If you believe a child has provided
            us with personal information, please contact us so we can remove it.{"\n\n"}
            We may update this Privacy Policy from time to time to reflect changes in our
            practices or for legal reasons. We will notify you of significant changes within
            the app. Continued use of the app after changes take effect constitutes
            acceptance of the updated policy.{"\n\n"}
            If you have questions or concerns about this Privacy Policy or how your
            information is handled, please reach out to us through the support section in
            the app.
          </Text>

          {/* CHECKBOX */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setChecked(!checked)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>
              I have read and agree to the Privacy Policy
            </Text>
          </TouchableOpacity>

          {/* AGREE BUTTON */}
          <TouchableOpacity
            style={[
              styles.agreeBtn,
              !checked && !agreed && styles.agreeBtnDisabled,
              agreed && styles.agreedBtn,
            ]}
            onPress={handleAgree}
            disabled={agreed || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : agreed ? (
              <View style={styles.agreedRow}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.agreeText}>Agreed</Text>
              </View>
            ) : (
              <Text style={styles.agreeText}>Agree</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Bottomnav />
    </SafeAreaView>
  );
}

/* ====================== STYLES ====================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8fb",
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

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },

  updatedText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 14,
    marginBottom: 6,
  },

  paragraph: {
    fontSize: 13.5,
    lineHeight: 21,
    color: "#4B5563",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 18,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#1d8cf8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  checkboxChecked: {
    backgroundColor: "#1d8cf8",
  },

  checkboxLabel: {
    fontSize: 13.5,
    color: "#374151",
    flex: 1,
  },

  agreeBtn: {
    backgroundColor: "#1d8cf8",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
  },

  agreeBtnDisabled: {
    backgroundColor: "#FFD2BB",
  },

  agreedBtn: {
    backgroundColor: "#22C55E",
  },

  agreedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  agreeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
