import { Routes, Route } from "react-router-dom";

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
import { ProtectedRoute } from "./protectedRoutes";
import AdminDashboard from "./pages/admin/adminDashboard/AdminDashboard";
import AdminStations from "./pages/admin/adminStations/AdminStations";
import AdminStationReview from "./pages/admin/adminStations/AdminStationReview";
import AdminReviews from "./pages/admin/adminReviews/AdminReviews";
import AdminCustomers from "./pages/admin/adminCustomers/AdminCustomers";  // ← NEW
import Customer from "./pages/admin/customers/Customer";                   // ← KEEP for legacy path
import Bookings from "./pages/admin/bookings/Bookings";
import Reports from "./pages/admin/reports/Reports";


function AppRoutes() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes */}
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Signup />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <HomeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="admin-dashboard" element={<AdminDashboard />} />
        <Route path="admin-stations" element={<AdminStations />} />
        <Route path="admin-stations/:id" element={<AdminStationReview />} />
        <Route path="admin-reviews" element={<AdminReviews />} />
        <Route path="admin-customers" element={<AdminCustomers />} />       {/* ← UPDATED */}
        <Route path="admin-bookings" element={<Bookings />} />
        <Route path="admin-reports" element={<Reports />} />
        <Route path="notifications" element={<Notify />} />
      </Route>

      {/* Protected routes for regular users */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['user', 'admin', 'station_owner']}>
            <HomeLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="stations" element={<Stat />} />
        <Route path="services" element={<Serv />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<Notify />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;