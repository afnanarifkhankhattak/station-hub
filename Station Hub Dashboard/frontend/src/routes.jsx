import { Routes, Route, Navigate } from "react-router-dom";

import Auth from "./pages/auth/LoginPage";
import HomeLayout from "./pages/home/Home";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/profile";
import Settings from "./pages/settings/settings";
import Notify from "./pages/notification/notifications";
import Serv from "./pages/services/services";
import Stat from "./pages/Stations/Station";
import Signup from "./pages/auth/SignupPage";
import LandingPage from "./pages/LandingPage/LandingPage";
import ProtectedRoute from "./protectedRoutes";

function AppRoutes() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes */}
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected layout wrapper */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="stations" element={<Stat />} />
        <Route path="services" element={<Serv />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="Notify" element={<Notify />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default AppRoutes;