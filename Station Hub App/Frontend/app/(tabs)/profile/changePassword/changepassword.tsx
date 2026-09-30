import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { uiGoBack } from "@/utils/uiGoBack";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Bottomnav from "@/components/Bottomnav";
import { API_BASE } from "../../../../src/config"; // adjust relative path as needed
import { apiFetch } from "../../../../src/api";


export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match.");
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await apiFetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        uiGoBack();
      } else {
        Alert.alert("Error", data.detail || "Failed to change password.");
      }
    } catch (e) {
      Alert.alert("Error", "Cannot connect to server.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP GRADIENT */}
      <LinearGradient
        colors={["#FFE4DA", "#FFF4EC", "#FFFFFF"]}
        style={styles.gradient}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={uiGoBack}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Change Password</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* CARD */}
        <View style={styles.card}>
          {/* CURRENT PASSWORD */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Current Password <Text style={{ color: "red" }}>*</Text>
            </Text>

            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={[
                styles.input,
                {
                  borderBottomColor:
                    focusedInput === "current" ? "#1d8cf8" : "#E5E7EB",
                },
              ]}
              onFocus={() => setFocusedInput("current")}
              onBlur={() => setFocusedInput("")}
            />
          </View>

          {/* NEW PASSWORD */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              New Password <Text style={{ color: "red" }}>*</Text>
            </Text>

            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={[
                styles.input,
                {
                  borderBottomColor:
                    focusedInput === "new" ? "#1d8cf8" : "#E5E7EB",
                },
              ]}
              onFocus={() => setFocusedInput("new")}
              onBlur={() => setFocusedInput("")}
            />
          </View>

          {/* CONFIRM PASSWORD */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Confirm New Password <Text style={{ color: "red" }}>*</Text>
            </Text>

            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={[
                styles.input,
                {
                  borderBottomColor:
                    focusedInput === "confirm" ? "#1d8cf8" : "#E5E7EB",
                },
              ]}
              onFocus={() => setFocusedInput("confirm")}
              onBlur={() => setFocusedInput("")}
            />
          </View>

          {/* BUTTONS */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveText}>Save Change</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
              <Text style={styles.discardText}>Discard</Text>
            </TouchableOpacity>
          </View>
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

  inputWrapper: {
    marginBottom: 22,
  },

  label: {
    color: "#1d8cf8",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    borderBottomWidth: 2,
    paddingBottom: 10,
    fontSize: 15,
    color: "#1A1A1A",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 12,
  },

  saveBtn: {
    flex: 1,
    backgroundColor: "#1d8cf8",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  discardBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#1d8cf8",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: "transparent",
  },

  discardText: {
    color: "#1d8cf8",
    fontWeight: "600",
    fontSize: 15,
  },
});