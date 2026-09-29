import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BookingEventsProvider } from "../context/bookingEventsContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <BookingEventsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash/splash1" />
          {/* <Stack.Screen name="onboarding" /> */}
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="set-location" />
          <Stack.Screen name="choose-location" />
        </Stack>
      </BookingEventsProvider>
      
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
