import React, { useState, useEffect } from "react";
import { api } from "../../api/api";
import { useTheme } from "../../context/theme.Context";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

// ── SVG Icons ──────────────────────────────────────────────
const IconShop = () => (
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
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);
const IconClock = () => (
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
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconSun = () => (
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
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
    />
  </svg>
);
const IconMoon = () => (
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
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);
const IconLocation = () => (
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
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const IconSave = () => (
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
      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
    />
  </svg>
);
const IconPause = () => (
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
      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconBell = () => (
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
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);
const IconTrash = () => (
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
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const IconEye = () => (
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
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

// ── Feedback ───────────────────────────────────────────────
const Msg = ({ msg }) => {
  if (!msg) return null;
  const isOk = msg.startsWith("ok:");
  return (
    <p
      className={`text-xs font-medium mt-1 ${isOk ? "text-green-500" : "text-red-500"}`}
    >
      {isOk ? "✓ " : "✕ "}
      {msg.slice(3)}
    </p>
  );
};

// ── Sub-components OUTSIDE Settings to prevent re-render focus loss ──
const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  mono = false,
  span2 = false,
  inp,
  lbl,
}) => (
  <div className={span2 ? "col-span-2" : ""}>
    <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm border rounded-xl outline-none transition-all ${inp} ${mono ? "font-mono tracking-wide" : ""}`}
    />
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  span2 = false,
  sel,
  lbl,
}) => (
  <div className={span2 ? "col-span-2" : ""}>
    <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 text-sm border rounded-xl outline-none transition-all ${sel}`}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  </div>
);

const SaveBtn = ({ onClick, loading: l, label = "Save Changes" }) => (
  <button
    onClick={onClick}
    disabled={l}
    className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-5 py-2 rounded-xl transition-all shadow-sm disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
  >
    {l ? (
      <>
        <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />{" "}
        Saving…
      </>
    ) : (
      <>
        <IconSave />
        {label}
      </>
    )}
  </button>
);

const CardHeader = ({ icon, title, txt, head }) => (
  <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${head}`}>
    <span className="text-orange-500">{icon}</span>
    <p className={`text-sm font-semibold ${txt}`}>{title}</p>
  </div>
);

const OPEN_TIMES = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"];
const CLOSE_TIMES = [
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];
const BREAK_START = ["12:00", "13:00", "14:00"];
const BREAK_END = ["13:00", "14:00", "15:00"];
const SLOTS = ["15 mins", "30 mins", "1 hour"];
const DEFAULT_CATEGORIES = [
  "Car Wash & Detailing",
  "Auto Repair",
  "Tyre & Wheel Service",
  "Oil & Lube",
  "Transport / Bus Station",
  "Fuel Station",
  "Electric Vehicle Charging",
  "Parking",
  "Motorcycle Service",
  "Truck & Heavy Vehicle",
];

const Toggle = ({ enabled, onToggle, dark: D }) => (
  <button
    onClick={() => onToggle(!enabled)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
      enabled ? "bg-orange-500" : D ? "bg-[#2a2d3e]" : "bg-gray-200"
    }`}
  >
    <span
      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
        enabled ? "translate-x-0.5" : "translate-x-[-16px]"
      }`}
    />
  </button>
);

// ── Main Component ─────────────────────────────────────────
const Settings = () => {
  const { dark, toggleTheme } = useTheme();
  const handleThemeToggle = async (val) => {
    toggleTheme(val);
    try {
      await api.put("/settings/theme", { theme: val });
    } catch {}
  };

  const [clearingServices, setClearingServices] = useState(false);
  const [clearingStations, setClearingStations] = useState(false);

  // ── Page state ─────────────────────────────────────────
  const [loading, setLoading] = useState(true);

  // Categories from DB
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState("");
  const [catMsg, setCatMsg] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  const [togglingServiceId, setTogglingServiceId] = useState(null);
  const [services, setServices] = useState([]);
  const [hiddenServices, setHiddenServices] = useState([]);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(
    () => localStorage.getItem("hideServicesToggle") === "true",
  );
  // Service Settings
  const [defaultVisibility, setDefaultVisibility] = useState(true);

  // Notifications
  const [notifyNewBooking, setNotifyNewBooking] = useState(true);

  // Danger Zone
  const [clearServicesConfirm, setClearServicesConfirm] = useState(false);
  const [clearStationsConfirm, setClearStationsConfirm] = useState(false);

  /////////////////////////// HANDLE DEL SERVICES AND STATIOS///////////////////////
  const handleClearServices = async () => {
    setClearingServices(true);
    try {
      await Promise.all(services.map((s) => api.delete(`/services/${s.id}`)));
      setServices([]);
      setHiddenServices([]);
      setClearServicesConfirm(false);
    } catch (e) {
      console.error("Failed to clear services", e);
    } finally {
      setClearingServices(false);
    }
  };

  const handleClearStations = async () => {
    setClearingStations(true);
    try {
      const snapshot = await getDocs(collection(db, "stations"));
      await Promise.all(
        snapshot.docs.map((d) => deleteDoc(doc(db, "stations", d.id))),
      );
      setClearStationsConfirm(false);
    } catch (e) {
      console.error("Failed to clear stations", e);
    } finally {
      setClearingStations(false);
    }
  };
  ////////////////////////////////////////////////////////////////////////

  // ── Fetch settings + categories from DB ───────────────
  useEffect(() => {
    (async () => {
      try {
        const [settingsData, catData] = await Promise.all([
          api.get("/settings/"),
          api.get("/settings/categories"),
        ]);
        const s = settingsData.settings || {};
        // add this inside the try block of your existing useEffect alongside your other api.get calls
        const servicesData = await api.get("/services/");
        const fetchedServices = servicesData.services || servicesData || [];
        setServices(fetchedServices);
        setHiddenServices(
          fetchedServices
            .filter((s) => s.status === "Unavailable")
            .map((s) => s.id),
        );
        setShopName(s.shop_name || "");
        setAddress(s.address || "");
        setShopPhone(s.phone || "");
        setShopEmail(s.email || "");
        setCategory(s.category || DEFAULT_CATEGORIES[0]);
        setDescription(s.description || "");
        setLatitude(s.latitude || null);
        setLongitude(s.longitude || null);
        setMonFriOpen(s.mon_fri_open || "09:00");
        setMonFriClose(s.mon_fri_close || "18:00");
        setSatOpen(s.sat_open || "10:00");
        setSatClose(s.sat_close || "17:00");
        setSunOff(s.sun_off !== undefined ? s.sun_off : true);
        setBreakStart(s.break_start || "13:00");
        setBreakEnd(s.break_end || "14:00");
        setSlotDuration(s.slot_duration || "30 mins");
        setMaxBookings(s.max_bookings || 10);
        // if (s.theme) {
        //   setDark(s.theme === "dark");
        //   localStorage.setItem("theme", s.theme);
        //   document.documentElement.classList.toggle("dark", s.theme === "dark");
        // }
        if (s.theme) {
          toggleTheme(s.theme);
        }
        if (catData.categories?.length) setCategories(catData.categories);
      } catch {
        /* use defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Get current location ───────────────────────────────
  const getCurrentLocation = () => {
    setLocMsg("Detecting location...");
    if (!navigator.geolocation) {
      setLocMsg("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        // Reverse geocode using OpenStreetMap Nominatim (free, no API key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          );
          const data = await res.json();
          if (data.display_name) {
            setAddress(data.display_name);
            setLocMsg("ok:Location detected");
          } else {
            setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            setLocMsg("ok:Coordinates set");
          }
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          setLocMsg("ok:Coordinates set");
        }
      },
      (err) => {
        setLocMsg("Could not get location: " + err.message);
      },
      { enableHighAccuracy: true },
    );
  };

  // ── Add new category (uses raw fetch with token — same fix as change-password) ──
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    setCatSaving(true);
    setCatMsg("");
    try {
      const token = localStorage.getItem("token");
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${BASE_URL}/settings/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to add category");
      }
      setCategories((prev) => [...prev, newCategory.trim()]);
      setNewCategory("");
      setCatMsg("ok:Category added");
    } catch (e) {
      setCatMsg("err:" + (e.message || "Failed to add category"));
    } finally {
      setCatSaving(false);
    }
  };

  // ── Save handlers ──────────────────────────────────────
  const saveShopInfo = async () => {
    setShopSaving(true);
    setShopMsg("");
    try {
      await api.put("/settings/shop-info", {
        shop_name: shopName,
        address,
        phone: shopPhone,
        email: shopEmail,
        category,
        description,
        latitude,
        longitude,
      });
      setShopMsg("ok:Shop information saved");
    } catch (e) {
      setShopMsg("err:" + (e.message || "Save failed"));
    } finally {
      setShopSaving(false);
    }
  };

  const saveAvailability = async () => {
    setAvailSaving(true);
    setAvailMsg("");
    try {
      await api.put("/settings/availability", {
        mon_fri_open: monFriOpen,
        mon_fri_close: monFriClose,
        sat_open: satOpen,
        sat_close: satClose,
        sun_off: sunOff,
        break_start: breakStart,
        break_end: breakEnd,
        slot_duration: slotDuration,
        max_bookings: maxBookings,
      });
      setAvailMsg("ok:Availability saved");
    } catch (e) {
      setAvailMsg("err:" + (e.message || "Save failed"));
    } finally {
      setAvailSaving(false);
    }
  };

  // ── Theme tokens ───────────────────────────────────────
  const D = dark;
  const bg = D ? "bg-[#0f1117]" : "bg-gray-50";
  const card = D ? "bg-[#1a1d27] border-[#2a2d3e]" : "bg-white border-gray-100";
  const head = D ? "border-[#2a2d3e]" : "border-gray-100";
  const txt = D ? "text-gray-100" : "text-gray-900";
  const sub = D ? "text-gray-400" : "text-gray-500";
  const lbl = D ? "text-gray-400" : "text-gray-600";
  const inp = D
    ? "bg-[#0f1117] border-[#2a2d3e] text-gray-100 focus:border-orange-500"
    : "bg-white border-gray-200 text-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
  const sel = D
    ? "bg-[#0f1117] border-[#2a2d3e] text-gray-100 focus:border-orange-500"
    : "bg-white border-gray-200 text-gray-700 focus:border-orange-400";

  if (loading)
    return (
      <div
        className={`flex items-center justify-center h-full min-h-[300px] ${bg}`}
      >
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className={`p-6 min-h-full transition-colors duration-300 ${bg}`}>
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className={`text-xl font-semibold ${txt}`}>Settings</h1>
        <p className={`text-sm mt-0.5 ${sub}`}>
          Manage your shop details and preferences
        </p>
      </div>

      <div className="flex flex-col gap-5 max-w-4xl">
        {/* ══ THEME CARD ══ */}
        <div className={`border rounded-2xl shadow-sm overflow-hidden ${card}`}>
          <CardHeader
            icon={D ? <IconMoon /> : <IconSun />}
            title="Appearance"
            txt={txt}
            head={head}
          />
          <div className="p-5">
            <p className={`text-xs font-medium mb-3 ${lbl}`}>App Theme</p>
            <div className="flex items-center gap-3">
              {/* Light */}
              <button
                onClick={() => handleThemeToggle("light")}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                  !dark
                    ? "border-orange-500 bg-orange-500/10"
                    : D
                      ? "border-[#2a2d3e] hover:border-gray-500"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                  <IconSun />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${txt}`}>Light Mode</p>
                  <p className={`text-xs ${sub}`}>Clean white interface</p>
                </div>
                {!dark && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </button>

              {/* Dark */}
              <button
                onClick={() => handleThemeToggle("dark")}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                  dark
                    ? "border-orange-500 bg-orange-500/10"
                    : D
                      ? "border-[#2a2d3e] hover:border-gray-500"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-white">
                    <IconMoon />
                  </span>
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${txt}`}>Dark Mode</p>
                  <p className={`text-xs ${sub}`}>Easy on the eyes</p>
                </div>
                {dark && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </div>
            <p className={`text-xs mt-3 ${sub}`}>
              Theme is applied across all pages and saved to your account.
            </p>
          </div>
        </div>

        {/* ══ SERVICE SETTINGS CARD ══ */}
        {/* <div className={`border rounded-2xl shadow-sm overflow-hidden ${card}`}>
          <CardHeader
            icon={<IconPause />}
            title="Service Settings"
            txt={txt}
            head={head}
          />
          <div className="p-5 flex flex-col gap-4">
          

            Default service visibility
            <div
              className={`flex flex-col gap-3 p-4 rounded-xl border ${D ? "bg-[#0f1117] border-[#2a2d3e]" : "bg-gray-50 border-gray-100"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`text-sm font-medium ${txt}`}>
                    Hide Specific Services
                  </p>
                  <p className={`text-xs mt-0.5 ${sub}`}>
                    Select services to hide from customers without deleting them
                  </p>
                </div>
                <Toggle
                  enabled={showVisibilityDropdown}
                  onToggle={(val) => {
                    setShowVisibilityDropdown(val);
                    localStorage.setItem("hideServicesToggle", val);
                  }}
                  dark={D}
                />
              </div>

              {showVisibilityDropdown && (
                <div className={`flex flex-col gap-2 pt-3 border-t ${head}`}>
                  {services.length === 0 ? (
                    <p className={`text-xs ${sub}`}>
                      No services found. Add services first.
                    </p>
                  ) : (
                    services.map((service) => {
                      const isHidden = hiddenServices.includes(service.id);
                      return (
                        <div
                          key={service.id}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                            isHidden
                              ? D
                                ? "border-orange-500/40 bg-orange-500/10"
                                : "border-orange-300 bg-orange-50"
                              : D
                                ? "border-[#2a2d3e] bg-[#1a1d27]"
                                : "border-gray-100 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={
                                isHidden ? "text-orange-500" : `${sub}`
                              }
                            >
                              <IconEye />
                            </span>
                            <div>
                              <p className={`text-xs font-medium ${txt}`}>
                                {service.name}
                              </p>
                              <p className={`text-xs ${sub}`}>
                                {(() => {
                                  const cats = service.categories || {};
                                  const catKeys = Object.keys(cats);
                                  const labels = {
                                    sedan: "Sedan",
                                    hatchback: "Hatchback",
                                    suv: "SUV/Crossover",
                                    full_suv: "Full SUV",
                                    pickup: "Pickup",
                                    economy_bike: "Economy",
                                    standard_bike: "Standard",
                                    premium_bike: "Premium",
                                  };
                                  if (catKeys.length > 0) {
                                    return catKeys.map(k => `${labels[k] || k.replace(/_/g, ' ')}: Rs ${cats[k]?.price ?? '—'}`).join(', ');
                                  }
                                  return service.price != null ? `Rs ${service.price}` : 'No price set';
                                })()}
                              </p>
                            </div>
                          </div>
                          <button

                            disabled={togglingServiceId === service.id}
                            onClick={async () => {
                              setTogglingServiceId(service.id);
                              const newStatus = isHidden
                                ? "Active"
                                : "Unavailable";
                              try {
                                await api.put(`/services/${service.id}`, {
                                  name: service.name,
                                  categories: service.categories || {},
                                  description: service.description || "",
                                  status: newStatus,
                                  rating: service.rating || null,
                                  image_url: service.image_url || "",
                                  station_ids: service.station_ids || [],
                                });
                                setServices((prev) =>
                                  prev.map((s) =>
                                    s.id === service.id
                                      ? { ...s, status: newStatus }
                                      : s,
                                  ),
                                );
                                setHiddenServices((prev) =>
                                  isHidden
                                    ? prev.filter((id) => id !== service.id)
                                    : [...prev, service.id],
                                );
                              } catch (e) {
                                console.error(
                                  "Failed to update service status",
                                  e,
                                );
                              } finally {
                                setTogglingServiceId(null);
                              }
                            }}
                            className={`text-xs font-medium px-3 py-1 rounded-lg border transition-all cursor-pointer disabled:opacity-60 ${
                              isHidden
                                ? "text-orange-500 border-orange-300 hover:bg-orange-100"
                                : D
                                  ? "text-gray-400 border-[#2a2d3e] hover:border-gray-500"
                                  : "text-gray-500 border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {togglingServiceId === service.id ? (
                              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                            ) : isHidden ? (
                              "Unavailable"
                            ) : (
                              "Available"
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}

                  {hiddenServices.length > 0 && (
                    <div
                      className={`flex items-center justify-between pt-2 border-t ${head}`}
                    >
                      <p className={`text-xs ${sub}`}>
                        {hiddenServices.length} service
                        {hiddenServices.length > 1 ? "s" : ""} hidden
                      </p>
                      <button
                        onClick={() => setHiddenServices([])}
                        className={`text-xs text-orange-500 hover:text-orange-600 font-medium cursor-pointer`}
                      >
                        Show all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div> */}

        {/* ══ NOTIFICATIONS CARD ══ */}
        <div className={`border rounded-2xl shadow-sm overflow-hidden ${card}`}>
          <CardHeader
            icon={<IconBell />}
            title="Notifications"
            txt={txt}
            head={head}
          />
          <div className="p-5 flex flex-col gap-4">
            <div
              className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${D ? "bg-[#0f1117] border-[#2a2d3e]" : "bg-gray-50 border-gray-100"}`}
            >
              <div>
                <p className={`text-sm font-medium ${txt}`}>
                  New Booking Emails
                </p>
                <p className={`text-xs mt-0.5 ${sub}`}>
                  Receive an email on your registered address whenever a
                  customer books
                </p>
              </div>
              <Toggle
                enabled={notifyNewBooking}
                onToggle={setNotifyNewBooking}
                dark={D}
              />
            </div>
          </div>
        </div>

        {/* ══ DANGER ZONE CARD ══ */}
        <div
          className={`border rounded-2xl shadow-sm overflow-hidden ${D ? "bg-[#1a1d27] border-red-900/40" : "bg-white border-red-100"}`}
        >
          <div
            className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${D ? "border-red-900/40 bg-red-900/10" : "border-red-100 bg-red-50/40"}`}
          >
            <span className="text-red-500">
              <IconTrash />
            </span>
            <p className="text-sm font-semibold text-red-500">Danger Zone</p>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {/* Clear all services */}
            <div
              className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${D ? "bg-[#0f1117] border-[#2a2d3e]" : "bg-gray-50 border-gray-100"}`}
            >
              <div>
                <p className={`text-sm font-medium ${txt}`}>
                  Clear All Services
                </p>
                <p
                  className={`text-xs mt-0.5 ${clearServicesConfirm ? "text-red-400 font-medium" : sub}`}
                >
                  {clearServicesConfirm
                    ? "⚠ Click again to confirm — this cannot be undone"
                    : "Permanently delete all your services"}
                </p>
              </div>
              <button
                disabled={clearingServices}
                onClick={() => {
                  if (!clearServicesConfirm) {
                    setClearServicesConfirm(true);
                    return;
                  }
                  handleClearServices();
                }}
                className={`text-xs font-semibold flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all flex-shrink-0 cursor-pointer ${
                  clearServicesConfirm
                    ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                    : "text-red-500 border-red-200 hover:bg-red-50"
                }`}
              >
                <IconTrash />
                {clearingServices ? (
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                ) : clearServicesConfirm ? (
                  "Confirm"
                ) : (
                  "Clear"
                )}
              </button>
            </div>

            {/* Clear all stations */}
            <div
              className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${D ? "bg-[#0f1117] border-[#2a2d3e]" : "bg-gray-50 border-gray-100"}`}
            >
              <div>
                <p className={`text-sm font-medium ${txt}`}>
                  Clear All Stations
                </p>
                <p
                  className={`text-xs mt-0.5 ${clearStationsConfirm ? "text-red-400 font-medium" : sub}`}
                >
                  {clearStationsConfirm
                    ? "⚠ Click again to confirm — this cannot be undone"
                    : "Permanently delete all your stations"}
                </p>
              </div>
              <button
                disabled={clearingStations}
                onClick={() => {
                  if (!clearStationsConfirm) {
                    setClearStationsConfirm(true);
                    return;
                  }
                  handleClearStations();
                }}
                className={`text-xs font-semibold flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all flex-shrink-0 cursor-pointer ${
                  clearStationsConfirm
                    ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                    : "text-red-500 border-red-200 hover:bg-red-50"
                }`}
              >
                <IconTrash />
                {clearingStations ? (
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                ) : clearStationsConfirm ? (
                  "Confirm"
                ) : (
                  "Clear"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
