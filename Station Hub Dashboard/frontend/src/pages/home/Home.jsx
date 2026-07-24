import React, { useState, useEffect } from "react";
import UserMenuModal from "../../components/modals/menuModal";
import DarkLogo from "../../assets/darkMainLogo.png";
import LightLogo from "../../assets/lightMainLogo.png";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api/api";
import { useTheme } from "../../context/theme.Context";
import { useNotifications } from "../../context/NotificationContext";

//////////////////////////////////////////////////////////////////////////////////
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";

// paste inside your component
const addTestBooking = async () => {
  try {
    await addDoc(collection(db, "bookings"), {
      car: "Economy Bus — MUL-LHR-02",
      created_at: "2026-06-12T14:20:00.000000",
      from_location: "Peshawar",
      price: 800,
      seat_count: 1,
      service_id: "service_002",
      station_id: "station_003",
      status: "pending",
      to_location: "Islamabad",
      travel_date: "2026-09-15",
      travel_time: "05:00 PM",
      user_id: "user_004",
      user_name: "Fatima Malik",
      dashboardRead: false,
    });
    alert("Booking added!");
  } catch (e) {
    console.error(e);
    alert("Failed: " + e.message);
  }
};

// ── Inline SVG Icons ──────────────────────────────────────
const IconMenu = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);
const IconDashboard = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);
const IconServices = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
    />
  </svg>
);
const IconProfile = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const IconSettings = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
    />
  </svg>
);
const IconBell = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);
const IconMore = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
    />
  </svg>
);
const IconStation = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7h8M8 12h8M8 17h4M5 3h14a2 2 0 012 2v16l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 012-2z"
    />
  </svg>
);

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: <IconDashboard /> },
  { name: "Stations", path: "/stations", icon: <IconStation /> },
  { name: "Services", path: "/services", icon: <IconServices /> },
  { name: "Profile", path: "/profile", icon: <IconProfile /> },
  { name: "Settings", path: "/settings", icon: <IconSettings /> },
];

export default function HomeLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  // const dark = useDarkMode();
  const { unreadCount } = useNotifications();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  // 1. Declare state FIRST
  const [stored, setStored] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}"),
  );

  // 2. Then derive from it
  const sidebarName = stored.full_name || stored.email || "User";
  const sidebarEmail = stored.email || "";
  const sidebarAvatar = stored.avatar_url || null;

  const sidebarInitials = sidebarName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // 3. Then the useEffect
  useEffect(() => {
    const sync = () =>
      setStored(JSON.parse(localStorage.getItem("user") || "{}"));
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const { dark } = useTheme();

  // ── Theme tokens ──────────────────────────────────────
  const bg = dark ? "bg-[#0f1117]" : "bg-gray-100";
  const navbar = dark
    ? "bg-[#1a1d27] border-[#2a2d3e]"
    : "bg-white border-gray-200";
  const sidebar = dark
    ? "bg-[#1a1d27] border-[#2a2d3e]"
    : "bg-white border-gray-200";
  const txt = dark ? "text-gray-100" : "text-gray-800";
  const sub = dark ? "text-gray-400" : "text-gray-500";
  const iconCol = dark ? "text-gray-400" : "text-gray-500";
  const hoverNav = dark ? "hover:bg-[#2a2d3e]" : "hover:bg-gray-100";
  const bellBg = dark
    ? "bg-[#2a2d3e] text-gray-300 hover:bg-[#353849] hover:text-orange-400"
    : "bg-gray-100 text-gray-500 hover:text-orange-500 hover:bg-orange-50";
  const userCard = dark
    ? "bg-orange-500/10 border-orange-500/30"
    : "bg-orange-500/10 border-orange-500/30";
  const mainBg = dark ? "bg-[#0f1117]" : "bg-gray-50";

  return (
    <div
      className={`flex flex-col h-screen font-sans transition-colors duration-300 ${bg}`}
    >
      {/* ── TOP NAVBAR ── */}
      <header
        className={`h-16 w-screen border-b flex items-center justify-between pr-6 z-10 transition-colors duration-300 ${navbar}`}
      >
        <div
          className={`flex items-center w-52 px-2 py-0 justify-between gap-4 ${dark ? "border-[#2a2d3e]" : "border-gray-100"}`}
        >
          {/* Hamburger */}
          <div className="w-10 h-10 flex items-center justify-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${iconCol} hover:text-orange-500 ${dark ? "hover:bg-[#2a2d3e]" : "hover:bg-orange-50"}`}
            >
              <IconMenu />
            </button>
          </div>

          {/* Logo */}
          <div className="w-20 h-20 flex items-center mr-10 justify-center">
            {dark ? (
              <img
                src={DarkLogo}
                className="w-20 h-20 object-contain cursor-pointer"
              />
            ) : (
              <img
                src={LightLogo}
                className="w-20 h-20 object-contain cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* Right: notifications + avatar */}
        <div className="flex items-center gap-3">
          {/* <button
            onClick={addTestBooking}
            type="button"
            className=" bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            + Add Test Booking
          </button> */}
          <div
            onClick={() => navigate("/Notify")}
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${bellBg}`}
          >
            <IconBell />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white
                           text-xs font-bold rounded-full min-w-[18px] h-[18px]
                           flex items-center justify-center px-1 leading-none"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {/* <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold cursor-pointer">
            SJ
          </div> */}
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* ── SIDEBAR ── */}
        <aside
          className={`flex-shrink-0 h-full border-r flex flex-col transition-all duration-300 overflow-hidden ${sidebar} ${sidebarOpen ? "w-52" : "w-14"}`}
        >
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    active
                      ? "bg-orange-500/20 border border-orange-500 text-orange-500 font-medium"
                      : `${dark ? "text-gray-300" : "text-gray-600"} ${hoverNav}`
                  } ${!sidebarOpen ? "justify-center" : ""}`}
                  title={!sidebarOpen ? item.name : ""}
                >
                  <span className={active ? "text-orange-500" : iconCol}>
                    {item.icon}
                  </span>
                  {sidebarOpen && <span>{item.name}</span>}
                </button>
              );
            })}
          </nav>

          {/* Bottom user card */}
          <div
            className={`border-t px-2 py-4 ${dark ? "border-[#2a2d3e]" : "border-gray-100"}`}
          >
            <div
              className={`flex items-center gap-2 px-2 py-2 rounded-lg border ${userCard} ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                {sidebarAvatar ? (
                  <img
                    src={sidebarAvatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold">
                    {sidebarInitials}
                  </div>
                )}
              </div>

              {sidebarOpen && (
                <div className="min-w-0 flex items-center justify-between gap-2 flex-1">
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${txt}`}>
                      {sidebarName}
                    </p>
                    <p className={`text-xs truncate ${sub}`}>{sidebarEmail}</p>
                  </div>
                  <button
                    className={`transition-colors flex-shrink-0 ${dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setModalPosition({
                        top: rect.top - 128,
                        left: rect.right - 180,
                      });
                      setIsModalOpen(true);
                    }}
                  >
                    <IconMore />
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main
          className={`flex-1 overflow-auto transition-colors duration-300 ${mainBg}`}
        >
          <Outlet />
        </main>
      </div>

      <UserMenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        position={modalPosition}
      />
    </div>
  );
}
