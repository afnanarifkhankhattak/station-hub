import { Tabs } from "expo-router";
import { UserProvider } from "../../context/userContext";

export default function TabLayout() {
  return (
    <UserProvider>
      <Tabs
        initialRouteName="Home/home"
        // Hardware back is handled per root screen (double-press exit).
        backBehavior="none"
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="explore/explore" options={{ href: null }} />
        <Tabs.Screen name="Booking/booking" options={{ title: "Booking" }} />
        <Tabs.Screen name="Booking/bookingconfirm" options={{ href: null }} />
        <Tabs.Screen name="service/index" options={{ href: null }} />
        <Tabs.Screen name="service/[type]" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        <Tabs.Screen name="Home/home" options={{ href: null }} />
        <Tabs.Screen name="Home/stationdetail" options={{ href: null }} />
        <Tabs.Screen name="Home/notifications" options={{ href: null }} />
      </Tabs>
    </UserProvider>
  );
}
