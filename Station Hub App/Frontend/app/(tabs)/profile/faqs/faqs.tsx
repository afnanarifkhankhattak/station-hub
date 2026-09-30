import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { uiGoBack } from "@/utils/uiGoBack";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Bottomnav from "@/components/Bottomnav";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    id: "1",
    question: "How do I book a car wash service?",
    answer:
      "Go to the Services tab, choose between Basic or Premium, pick the service you want, then tap Schedule to select a station, date, and time slot.",
  },
  {
    id: "2",
    question: "Can I cancel or reschedule a booking?",
    answer:
      "Yes. Open your Booking History from the Profile tab, find the booking, and you'll see options to cancel or reschedule depending on how close it is to your appointment time.",
  },
  {
    id: "3",
    question: "Where can I find my bookings?",
    answer:
      "Open the MY Booking tab in the bottom navigation to see your upcoming, completed, cancelled, and rejected bookings.",
  },
  {
    id: "4",
    question: "What happens if a time slot is already booked?",
    answer:
      "Slots that are already taken for a station show as \"Booked\" and can't be selected. Choose a different time or station to continue.",
  },
  {
    id: "5",
    question: "How do I change my account password?",
    answer:
      "Go to Profile > Change Password, enter your current password followed by your new password, and tap Save Change.",
  },
  {
    id: "6",
    question: "Is my personal information safe?",
    answer:
      "Yes. We use reasonable technical safeguards to protect your data. You can read the full details in our Privacy Policy under Profile > Privacy Policy.",
  },
  {
    id: "7",
    question: "How do I update my profile picture or phone number?",
    answer:
      "Go to Profile > Manage your profile. Tap your avatar to change your photo, and edit your name or phone number directly in the form, then tap Save Change.",
  },
];

export default function FaqsScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        180,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
    setExpandedId((prev) => (prev === id ? null : id));
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
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={uiGoBack}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>FAQs</Text>

          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.subtitle}>
          Quick answers to common questions. Tap a question to see the answer.
        </Text>

        {/* FAQ LIST */}
        <View style={{ marginHorizontal: 16 }}>
          {FAQ_DATA.map((item) => {
            const isOpen = expandedId === item.id;
            return (
              <View key={item.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.questionRow}
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(item.id)}
                >
                  <Text style={styles.questionText}>{item.question}</Text>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#1d8cf8"
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.answerWrapper}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
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
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginHorizontal: 18,
    marginBottom: 18,
  },

  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  questionText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "600",
    color: "#1A1A1A",
    marginRight: 10,
  },

  answerWrapper: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  answerText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "#6B7280",
  },
});
