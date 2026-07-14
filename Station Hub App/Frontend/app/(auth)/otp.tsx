import React, { useState, useRef } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE } from "../../src/config";
import { apiFetch } from "../../src/api";


export default function VerifyOTP() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const inputs = useRef<TextInput[]>([]);

  const showError = (message: string) => {
    setToast({ visible: true, message, type: "error" });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 2500);
  };

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      showError("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await response.json();
      if (response.ok) {
        router.push({ pathname: "/newpassword", params: { email, otp: otpCode } });
      } else {
        showError(data.detail || "Invalid OTP");
      }
    } catch {
      showError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiFetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setToast({ visible: true, message: "OTP resent!", type: "success" });
      setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 2000);
    } catch {
      showError("Cannot connect to server");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.logoBox}>
        <Image
          source={require("../../assets/images/Logo.png")}
          style={styles.logo}
        />
      </View>

      <Text style={styles.heading}>Verify OTP</Text>
      <Text style={styles.subText}>
        We sent a 6-digit code to {email}
      </Text>

      <Text style={styles.label}>Enter OTP</Text>

      <View style={styles.otpRow}>
        {otp.map((item, index) => (
          <TextInput
            key={index}
            ref={(ref) => { if (ref) inputs.current[index] = ref; }}
            style={styles.otpBox}
            maxLength={1}
            keyboardType="number-pad"
            value={item}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
          />
        ))}
      </View>

      <Text style={styles.resend}>
        Didn't receive the code?{" "}
        <Text style={styles.orange} onPress={handleResend}>Resend</Text>
      </Text>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.whiteBtn}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.whiteBtnText}>Back to Login</Text>
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
    marginBottom: 15,
  },
  logo: {
    width: 190,
    height: 190,
    resizeMode: "contain",
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#1b2945",
  },
  subText: {
    fontSize: 12,
    textAlign: "center",
    color: "#444",
    marginTop: 8,
    marginBottom: 28,
  },
  label: {
    color: "#ff7a00",
    fontSize: 12,
    marginBottom: 8,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  otpBox: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: "#ff7a00",
    borderRadius: 6,
    textAlign: "center",
    fontSize: 18,
    backgroundColor: "#fff",
  },
  resend: {
    fontSize: 11,
    color: "#555",
    marginBottom: 18,
  },
  orange: {
    color: "#ff7a00",
  },
  button: {
    backgroundColor: "#ff9100",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
  },
  whiteBtn: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ff7a00",
    alignItems: "center",
  },
  whiteBtnText: {
    color: "#ff7a00",
    fontWeight: "600",
  },
  terms: {
    textAlign: "center",
    fontSize: 11,
    color: "#555",
    marginTop: 20,
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