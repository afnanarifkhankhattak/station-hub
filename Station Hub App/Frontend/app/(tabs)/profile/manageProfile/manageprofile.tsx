import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, Feather } from "@expo/vector-icons";
import Bottomnav from "@/components/Bottomnav";
import { useUser } from "../../../../context/userContext";
import { API_BASE } from "../../../../src/config"; // adjust relative path as needed

const CLOUDINARY_CLOUD_NAME = "dqlmva24c";
const CLOUDINARY_UPLOAD_PRESET = "StationHub";

async function uploadToCloudinary(uri: string) {
  const formData = new FormData();
  formData.append("file", {
    uri,
    type: "image/jpeg",
    name: "profile.jpg",
  } as any);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
}

export default function ManageProfileScreen() {
  const router = useRouter();
  const { user, loading: userLoading, updateUser } = useUser();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.full_name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setImage(user.profile_image || null);
    }
  }, [user]);

  /* IMAGE PICKER */

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow gallery access."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
  setImage(result.assets[0].uri);
}
  };

  /* SAVE */

  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    setSaving(true);
    try {
      let profile_image = user?.profile_image || "";

      // only upload if the image actually changed (local file uri, not the existing remote url)
      if (image && image !== user?.profile_image) {
        profile_image = await uploadToCloudinary(image);
      }

      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: name,
          phone,
          profile_image,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        updateUser(data.user);
        Alert.alert("Success", "Profile updated successfully.");
      } else {
        Alert.alert("Error", data.detail || "Failed to update profile.");
      }
    } catch (e) {
      Alert.alert("Error", "Cannot connect to server.");
    } finally {
      setSaving(false);
    }
  };

  /* DISCARD */

  const handleDiscard = () => {
    if (user) {
      setName(user.full_name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setImage(user.profile_image || null);
    }
  };

  if (userLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#FF7A45" size="large" />
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
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View style={styles.header} >
          <TouchableOpacity onPress={() => router.push("/profile")} >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#1A1A1A"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Manage your profile
          </Text>

          <View style={{ width: 24 }} />
        </View>

        {/* PROFILE CARD */}
        <View style={styles.card}>
          {/* AVATAR */}

          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <Image
              source={
                image
                  ? { uri: image }
                  : require("../../../../assets/images/johndoe.png")
              }
              style={styles.avatar}
            />

            <View style={styles.cameraIcon}>
              <Feather name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.changeText}>
            Change Profile Picture
          </Text>

          {/* NAME */}

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Name <Text style={{ color: "red" }}>*</Text>
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              placeholderTextColor="#9CA3AF"
              style={[
                styles.input,
                {
                  borderBottomColor:
                    focusedInput === "name"
                      ? "#FF7A45"
                      : "#E5E7EB",
                },
              ]}
              onFocus={() => setFocusedInput("name")}
              onBlur={() => setFocusedInput("")}
            />
          </View>

          {/* PHONE */}

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Phone Number{" "}
              <Text style={{ color: "red" }}>*</Text>
            </Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your Phone Number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              style={[
                styles.input,
                {
                  borderBottomColor:
                    focusedInput === "phone"
                      ? "#FF7A45"
                      : "#E5E7EB",
                },
              ]}
              onFocus={() => setFocusedInput("phone")}
              onBlur={() => setFocusedInput("")}
            />
          </View>

          {/* EMAIL */}

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              E-mail Address{" "}
              <Text style={{ color: "red" }}>*</Text>
            </Text>

            <TextInput
              value={email}
              editable={false}
              placeholder="Enter your E-mail Address"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, { color: "#9CA3AF" }]}
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

            <TouchableOpacity
              style={styles.discardBtn}
              onPress={handleDiscard}
            >
              <Text style={styles.discardText}>
                Discard
              </Text>
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
    backgroundColor: "#FAFAFA",
  },

  gradient: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 220,
  },

  /* HEADER */

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

  /* CARD */

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

  /* AVATAR */

  avatarContainer: {
    alignSelf: "center",
    marginBottom: 10,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF7A45",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  changeText: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 28,
    fontSize: 14,
  },

  /* INPUT */

  inputWrapper: {
    marginBottom: 22,
  },

  label: {
    color: "#FF7A45",
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

  /* BUTTONS */

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 12,
  },

  saveBtn: {
    flex: 1,
    backgroundColor: "#FF7A45",
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
    borderColor: "#FF7A45",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: "transparent",
  },

  discardText: {
    color: "#FF7A45",
    fontWeight: "600",
    fontSize: 15,
  },
});