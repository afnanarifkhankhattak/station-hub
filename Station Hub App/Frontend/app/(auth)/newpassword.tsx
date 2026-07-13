import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE } from "../../src/config";

export default function CreatePassword() {
  const router = useRouter();
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showError = (message: string) => {
    setToast({ visible: true, message, type: "error" });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 2500);
  };

  const handleReset = async () => {
    if (!password || !confirm) {
      showError("Please fill all fields");
      return;
    }
    if (password !== confirm) {
      showError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      showError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: password }),
      });
      const data = await response.json();
      if (response.ok) {
        setToast({ visible: true, message: "Password changed successfully!", type: "success" });
        setTimeout(() => router.replace("/login"), 2000);
      } else {
        showError(data.detail || "Reset failed");
      }
    } catch {
      showError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.heading}>Create New Password</Text>
      <Text style={styles.subText}>
        Your new password must be different from previous one
      </Text>

      <Text style={styles.label}>New Password</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          secureTextEntry={!show1}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShow1(!show1)}>
          <Ionicons
            name={show1 ? "eye-off-outline" : "eye-outline"}
            size={18}
            color="#ff7a00"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Confirm Password</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          secureTextEntry={!show2}
          value={confirm}
          onChangeText={setConfirm}
        />
        <TouchableOpacity onPress={() => setShow2(!show2)}>
          <Ionicons
            name={show2 ? "eye-off-outline" : "eye-outline"}
            size={18}
            color="#ff7a00"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Password must be at least 8 characters long. Include 1 number and 1 special character
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Change Password</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.terms}>
        View our <Text style={styles.orange}>Terms of Use</Text> and{" "}
        <Text style={styles.orange}>Privacy Policy</Text>
      </Text>

      {toast.visible && (
        <View style={[styles.toast, { backgroundColor: toast.type === "error" ? "#e74c3c" : "#FF7A00" }]}>
          <Text style={styles.toastText}>
            {toast.type === "error" ? "✕ " : "✓ "}{toast.message}
          </Text>
        </View>
      )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff5ee",
    padding: 22,
    justifyContent: "center",
  },
  logoBox: {
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 190,
    height: 190,
    resizeMode: "contain",
  },
  heading: {
    fontSize: 27,
    fontWeight: "700",
    textAlign: "center",
    color: "#1b2945",
  },
  subText: {
    textAlign: "center",
    fontSize: 11,
    color: "#444",
    marginTop: 8,
    marginBottom: 30,
  },
  label: {
    color: "#ff7a00",
    fontSize: 12,
    marginBottom: 6,
    marginTop: 10,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ff7a00",
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
  },
  note: {
    fontSize: 10,
    color: "#666",
    marginTop: 6,
    marginBottom: 22,
  },
  button: {
    backgroundColor: "#ff9100",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "700",
    color: "#000",
  },
  terms: {
    textAlign: "center",
    fontSize: 11,
    color: "#555",
    marginTop: 22,
  },
  orange: {
    color: "#ff7a00",
  },
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 10,
  },
  toastText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});