import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { API_BASE } from "../../src/config";

export default function ResetPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const showError = (message: string) => {
    setToast({ visible: true, message, type: "error" });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 2500);
  };

  const handleSendOTP = async () => {
    if (!email && !phone) {
      showError("Please enter your email or phone number");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || phone }),
      });
      const data = await response.json();
      if (response.ok) {
        setToast({ visible: true, message: "OTP sent!", type: "success" });
        setTimeout(() => {
          setToast({ visible: false, message: "", type: "success" });
          router.push({ pathname: "/otp", params: { email: email || phone } });
        }, 1500);
      } else {
        showError(data.detail || "Failed to send OTP");
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

      {/* Logo */}
      <View style={styles.logocolumn}>
        <Image
          source={require("../../assets/images/Logo.png")}
        />
      </View>

      {/* Heading */}
      <Text style={styles.heading}>Reset Password</Text>

      {/* Sub Text */}
      <Text style={styles.subText}>
        Enter your email or phone number to reset your password
      </Text>

      {/* Email */}
      <Text style={styles.label}>E-mail Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your E-mail Address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* OR */}
      <Text style={styles.orText}>OR</Text>

      {/* Phone */}
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your Phone Number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      {/* Info */}
      <Text style={styles.infoText}>
        We will send a verification code to your account
      </Text>

      {/* Send OTP */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      {/* Back to Login */}
      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.loginBtnText}>Back to Login</Text>
      </TouchableOpacity>

      {/* Terms */}
      <Text style={styles.terms}>
        View our{" "}
        <Text style={styles.termsLink}>Terms of Use</Text>
        {" "}and{" "}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>

      {/* Toast */}
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
    backgroundColor: "#fff7f2",
    padding: 20,
    justifyContent: "center",
  },
  logocolumn: {
    alignItems: "center",
    marginBottom: 15,
  },
  logoImg: {
    width: 210,
    height: 210,
    resizeMode: "contain",
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#1d2b53",
    marginBottom: 10,
  },
  subText: {
    textAlign: "center",
    fontSize: 12,
    color: "#666",
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  label: {
    color: "#ff7a00",
    fontSize: 13,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ff7a00",
    paddingVertical: 8,
    marginBottom: 10,
  },
  orText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#1d2b53",
    marginVertical: 10,
  },
  infoText: {
    textAlign: "left",
    color: "#666",
    fontSize: 13,
    marginTop: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#e77605",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginBtn: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loginBtnText: {
    color: "#1d2b53",
    fontSize: 16,
    fontWeight: "600",
  },
  terms: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 12,
    color: "#666",
  },
  termsLink: {
    color: "#ff7a00",
    fontWeight: "500",
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