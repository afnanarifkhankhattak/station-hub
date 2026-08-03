import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/theme.Context";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const CLOUDINARY_CLOUD_NAME = "dqlmva24c";
const CLOUDINARY_UPLOAD_PRESET = "StationHub";

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
}

// ── SVG Icons ──────────────────────────────────────────────
const IconPlus = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconEdit = () => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
const IconTrash = () => (
  <svg
    className="w-3.5 h-3.5"
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
const IconX = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const IconRefresh = () => (
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
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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
const IconPhone = () => (
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
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);
const IconBreakTime = () => (
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
      d="M4 10h11v5a4 4 0 01-4 4H8a4 4 0 01-4-4v-5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 11h2a2 2 0 010 4h-2"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 6v2M12 5v3" />
  </svg>
);
const IconClock = () => (
  <svg
    className="w-3.5 h-3.5"
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

// ── Empty State ────────────────────────────────────────────
const EmptyState = ({ onAdd, D }) => (
  <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center">
    <div
      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${D ? "bg-orange-500/20" : "bg-orange-50"}`}
    >
      <svg
        className="w-8 h-8 text-orange-300"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7h8M8 12h8M8 17h4M5 3h14a2 2 0 012 2v16l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 012-2z"
        />
      </svg>
    </div>
    <p
      className={`text-sm font-semibold mb-1 ${D ? "text-gray-200" : "text-gray-700"}`}
    >
      No stations yet
    </p>
    <p className={`text-xs mb-4 ${D ? "text-gray-500" : "text-gray-400"}`}>
      Add your first station to start managing routes
    </p>
    <button
      onClick={onAdd}
      className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-colors"
    >
      <IconPlus /> Add First Station
    </button>
  </div>
);

// ── Station Form ───────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  address: "",
  phone: "",
  city: "",
  category: "",
  status: "Active",
  opening: "08:00",
  closing: "18:00",
  sun_off: true,
  break_start: "13:00",
  break_end: "14:00",
  description: "",
  latitude: null,
  longitude: null,
  image_url: "",
};

const ALL_TIMES = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "00:00",
];
const BREAK_STARTS = ["12:00", "12:30", "13:00", "13:30", "14:00"];
const BREAK_ENDS = ["12:30", "13:00", "13:30", "14:00", "14:30", "15:00"];

const DEFAULT_CATEGORIES = [
  "Bus Terminal",
  "Mini Van Stop",
  "Coaster Stand",
  "Wagon Stop",
  "Intercity Hub",
  "Local Stop",
];

const StationForm = ({
  initial = EMPTY_FORM,
  onSave,
  onCancel,
  saving,
  error,
  title,
  D,
}) => {
  const [form, setForm] = useState(initial);
  const [imageFile, setImageFile] = useState(null); // ← add
  const [imagePreview, setImagePreview] = useState(initial.image_url || "");
  const [locMsg, setLocMsg] = useState("");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState("");
  const [catMsg, setCatMsg] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerCoords, setMapPickerCoords] = useState({ lat: null, lng: null });
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const lbl = D ? "text-gray-400" : "text-gray-600";
  const sub = D ? "text-gray-400" : "text-gray-500";
  const inp = D
    ? "bg-[#1a1d27] border-[#2a2d3e] text-gray-100 focus:border-orange-500"
    : "bg-white border-gray-200 text-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
  const sel = D
    ? "bg-[#1a1d27] border-[#2a2d3e] text-gray-100"
    : "bg-white border-gray-200 text-gray-700";
  const divider = D ? "border-[#2a2d3e]" : "border-gray-100";

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocMsg("Geolocation not supported");
      return;
    }
    setLocMsg("Detecting location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude);
        set("longitude", pos.coords.longitude);
        setLocMsg("ok:Location detected");
      },
      () => setLocMsg("Failed to detect location"),
    );
  };

  const handleMapPick = (lat, lng) => {
    set("latitude", lat);
    set("longitude", lng);
    setMapPickerCoords({ lat: null, lng: null });
    setShowMapPicker(false);
    setLocMsg("ok:Location picked from map");
  };

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

  useEffect(() => {
    if (!showMapPicker || leafletMapRef.current) return;
    const container = mapRef.current;
    if (!container) return;

    const map = L.map(container).setView(
      form.latitude && form.longitude
        ? [form.latitude, form.longitude]
        : [33.6844, 73.0479],
      13
    );
    leafletMapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    let marker = null;
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      setMapPickerCoords({ lat, lng });
      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map).bindPopup("Click Confirm to select").openPopup();
    });

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [showMapPicker, form.latitude, form.longitude]);

  const confirmMapPick = () => {
    if (mapPickerCoords.lat != null && mapPickerCoords.lng != null) {
      handleMapPick(mapPickerCoords.lat, mapPickerCoords.lng);
    }
  };

  const addCategory = () => {
    const val = newCategory.trim();
    if (!val) return;
    if (categories.includes(val)) {
      setCatMsg("err:Already exists");
      return;
    }
    setCategories((prev) => [...prev, val]);
    set("category", val);
    setNewCategory("");
    setCatMsg("ok:Category added");
    setTimeout(() => setCatMsg(""), 2000);
  };

  return (
    <div
      className={`border rounded-2xl shadow-sm overflow-hidden mb-4 ${D ? "bg-[#1a1d27] border-[#2a2d3e]" : "bg-white border-orange-200"}`}
    >
      {/* Form Header */}
      <div
        className={`flex items-center justify-between px-5 py-4 border-b ${D ? "bg-orange-500/10 border-[#2a2d3e]" : "border-gray-100 bg-orange-50/40"}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white">
            <IconPlus />
          </div>
          <p
            className={`text-sm font-semibold ${D ? "text-gray-100" : "text-gray-900"}`}
          >
            {title}
          </p>
        </div>
        <button
          onClick={onCancel}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${D ? "text-gray-500 hover:bg-[#2a2d3e]" : "text-gray-400 hover:bg-gray-100"}`}
        >
          <IconX />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {error && (
          <div
            className={`px-3 py-2 rounded-lg text-xs ${D ? "bg-red-500/20 border border-red-500/50 text-red-400" : "bg-red-50 border border-red-100 text-red-500"}`}
          >
            {error}
          </div>
        )}

        {/* ── Section 1: Basic Info ── */}
        <div className="grid grid-cols-3 gap-4">
          {/* Station Name */}
          <div className="col-span-2">
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              Station Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Rawalpindi Central Station"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-all ${inp}`}
            />
          </div>

          {/* Status */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-all ${sel}`}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          {/* City */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              City
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="e.g. Rawalpindi"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-all ${inp}`}
            />
          </div>

          {/* Phone */}
          <div className="col-span-2">
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              Phone Number
            </label>
            <div
              className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-all ${inp}`}
            >
              <span
                className={`flex-shrink-0 ${D ? "text-gray-500" : "text-gray-400"}`}
              >
                <IconPhone />
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+92-300-0000000"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          {/* Address */}
          <div className="col-span-3">
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              Location / Address
            </label>
            <div
              className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-all ${inp}`}
            >
              <span
                className={`flex-shrink-0 ${D ? "text-gray-500" : "text-gray-400"}`}
              >
                <IconLocation />
              </span>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="Street, City, Country"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex-shrink-0 whitespace-nowrap cursor-pointer"
              >
                Use Current
              </button>
            </div>
            {locMsg && (
              <p
                className={`text-xs mt-1 font-medium ${locMsg.startsWith("ok:") ? "text-green-500" : locMsg === "Detecting location..." ? "text-orange-500" : "text-red-500"}`}
              >
                {locMsg.startsWith("ok:") ? "✓ " : ""}
                {locMsg.replace("ok:", "")}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {form.latitude != null && form.longitude != null && (
                <>
                  <span className={`text-xs font-mono ${D ? "text-gray-400" : "text-gray-500"}`}>
                    📍 {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}
                  </span>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${form.latitude}&mlon=${form.longitude}#map=18/${form.latitude}/${form.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-500 hover:underline"
                  >
                    Verify on OSM
                  </a>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="text-xs text-orange-500 hover:text-orange-600 font-semibold cursor-pointer"
              >
                Pick on Map
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="col-span-3">
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              Station Category
            </label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-all ${sel}`}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {/* Add new category inline */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                placeholder="Add new category..."
                className={`flex-1 px-3 py-1.5 text-xs border rounded-lg outline-none transition-all ${inp}`}
              />
              <button
                type="button"
                onClick={addCategory}
                disabled={!newCategory.trim()}
                className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                + Add
              </button>
            </div>
            {catMsg && (
              <p
                className={`text-xs mt-1 font-medium ${catMsg.startsWith("ok:") ? "text-green-500" : "text-red-500"}`}
              >
                {catMsg.startsWith("ok:") ? "✓ " : "✕ "}
                {catMsg.slice(3)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="col-span-3">
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the station, facilities, nearby landmarks..."
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-all resize-none ${inp}`}
            />
          </div>
          {/* Station Image */}
          <div className="col-span-3">
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              Station Image (optional)
            </label>
            <div
              className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                D
                  ? "border-[#2a2d3e] hover:border-orange-500/50 bg-[#0f1117]"
                  : "border-gray-200 hover:border-orange-300 bg-gray-50"
              }`}
              onClick={() =>
                document.getElementById("station-image-input").click()
              }
            >
              {imagePreview ? (
                <div className="relative w-full">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview("");
                      set("image_url", "");
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${D ? "bg-orange-500/20" : "bg-orange-50"}`}
                  >
                    <svg
                      className="w-5 h-5 text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p
                    className={`text-xs font-medium ${D ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Click to upload image
                  </p>
                  <p
                    className={`text-[11px] ${D ? "text-gray-600" : "text-gray-400"}`}
                  >
                    PNG, JPG up to 2MB
                  </p>
                </>
              )}
            </div>
            <input
              id="station-image-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  alert("Image must be under 2MB");
                  return;
                }
                setImageFile(file);
                const reader = new FileReader();
                reader.onload = () => setImagePreview(reader.result);
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </div>

        {/* ── Section 2: Working Hours ── */}
        <div
          className={`border rounded-xl p-4 ${D ? "border-[#2a2d3e]" : "border-gray-100"}`}
        >
          <p
            className={`text-xs font-semibold mb-4 flex items-center gap-1.5 ${D ? "text-gray-300" : "text-gray-700"}`}
          >
            <IconClock /> Working Hours
          </p>

          <div className="flex flex-col gap-3">
            {/* Mon–Fri */}
            <div className="flex items-center gap-3">
              <span className={`text-xs w-20 flex-shrink-0 ${sub}`}>
                Mon – Fri
              </span>
              <select
                value={form.opening}
                onChange={(e) => set("opening", e.target.value)}
                className={`flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none ${sel}`}
              >
                {ALL_TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <span className={`text-xs ${sub}`}>—</span>
              <select
                value={form.closing}
                onChange={(e) => set("closing", e.target.value)}
                className={`flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none ${sel}`}
              >
                {ALL_TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            

            {/* Sunday */}
            <div className="flex items-center gap-3">
              <span className={`text-xs w-20 flex-shrink-0 ${sub}`}>
                Sunday
              </span>
              <button
                type="button"
                onClick={() => set("sun_off", !form.sun_off)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  form.sun_off
                    ? D
                      ? "bg-[#2a2d3e] text-gray-400 hover:text-red-400"
                      : "bg-gray-100 text-gray-400 hover:text-red-500"
                    : "bg-green-500/10 text-green-500 hover:bg-red-50 hover:text-red-500"
                }`}
              >
                {form.sun_off ? "OFF — click to open" : "Open — click to close"}
              </button>
            </div>

            {/* Break Time */}
            <div className={`pt-3 border-t ${divider}`}>
              <p className={`text-xs font-medium mb-2 ${lbl}`}>Break Time</p>
              <div className="flex items-center gap-3">
                <select
                  value={form.break_start}
                  onChange={(e) => set("break_start", e.target.value)}
                  className={`flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none ${sel}`}
                >
                  {BREAK_STARTS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <span className={`text-xs ${sub}`}>—</span>
                <select
                  value={form.break_end}
                  onChange={(e) => set("break_end", e.target.value)}
                  className={`flex-1 px-2 py-1.5 text-xs border rounded-lg outline-none ${sel}`}
                >
                  {BREAK_ENDS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div
          className={`flex items-center justify-end gap-3 pt-4 border-t ${divider}`}
        >
          <button
            onClick={onCancel}
            className={`px-4 py-2 text-sm font-medium border rounded-xl transition-colors ${D ? "text-gray-500 border-[#2a2d3e] hover:bg-[#2a2d3e]" : "text-gray-500 border-gray-200 hover:bg-gray-50"}`}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form, imageFile)}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />{" "}
                Saving…
              </>
            ) : (
              "Save Station"
            )}
          </button>
        </div>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl h-[60vh] bg-white rounded-2xl shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <h3 className="text-lg font-semibold">Pick Location on Map</h3>
              <button
                onClick={() => setShowMapPicker(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <div ref={mapRef} id="map-picker" className="flex-1 min-h-0 w-full" />
            <div className="px-4 py-3 border-t flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowMapPicker(false)}
                className="px-4 py-2 text-sm font-medium border rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmMapPick}
                disabled={!mapPickerCoords.lat || !mapPickerCoords.lng}
                className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Station Services Panel ─────────────────────────────────
const StationServicesPanel = ({ stationId, D }) => {
  const [rows, setRows] = useState([]);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    // listen to all serviceStationStatus docs for this station
    const q = query(
      collection(db, "serviceStationStatus"),
      where("stationId", "==", stationId),
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setRows([]);
        return;
      }

      // for each status doc, fetch the service name+price
      const results = await Promise.all(
        snapshot.docs.map(async (statusDoc) => {
          const { serviceId, isAvailable } = statusDoc.data();
          try {
            const svcSnap = await getDocs(
              query(
                collection(db, "services"),
                where("__name__", "==", serviceId),
              ),
            );
            if (svcSnap.empty) return null;
            const svc = svcSnap.docs[0].data();

            // Resolve price: try categories first (new shape), then top-level price (legacy)
            let price = null;
            const cats = svc.categories || {};
            const catKeys = Object.keys(cats);
            if (catKeys.length > 0) {
              // Show the first category's price as representative
              const firstCat = cats[catKeys[0]];
              price = firstCat?.price ?? null;
            } else if (svc.price != null) {
              price = svc.price;
            }

            return {
              statusDocId: statusDoc.id,
              serviceId,
              isAvailable,
              name: svc.name,
              price,
            };
          } catch {
            return null;
          }
        }),
      );

      setRows(results.filter(Boolean));
    });

    return () => unsub();
  }, [stationId]);

  const handleToggle = async (statusDocId, current) => {
    setToggling(statusDocId);
    try {
      await updateDoc(doc(db, "serviceStationStatus", statusDocId), {
        isAvailable: !current,
      });
    } catch (e) {
      console.error("Toggle failed:", e);
    } finally {
      setToggling(null);
    }
  };

  return (
    <div
      className={`rounded-xl p-3 my-1 ${
        D
          ? "bg-[#0f1117] border border-[#2a2d3e]"
          : "bg-gray-50 border border-gray-100"
      }`}
    >
      {/* Panel header */}
      <p
        className={`text-[11px] font-semibold uppercase tracking-wider mb-2.5 ${D ? "text-gray-500" : "text-gray-400"}`}
      >
        Services
      </p>

      {rows.length === 0 ? (
        <p className={`text-xs ${D ? "text-gray-600" : "text-gray-400"}`}>
          No services linked to this station.
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-20 overflow-y-auto pr-2 services-scroll">
          {rows.map((row) => (
            <div
              key={row.statusDocId}
              className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg ${
                D ? "bg-[#1a1d27]" : "bg-white border border-gray-100"
              }`}
            >
              {/* Name + Price */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-xs font-medium truncate ${
                    row.isAvailable
                      ? D
                        ? "text-gray-200"
                        : "text-gray-700"
                      : D
                        ? "text-gray-600"
                        : "text-gray-400"
                  }`}
                >
                  {row.name}
                </span>
                <span
                  className={`text-[11px] flex-shrink-0 ${D ? "text-gray-600" : "text-gray-400"}`}
                >
                  PKR {Number(row.price).toLocaleString()}
                </span>
              </div>

              {/* Toggle */}
              <button
                onClick={() => handleToggle(row.statusDocId, row.isAvailable)}
                disabled={toggling === row.statusDocId}
                className={`relative flex-shrink-0 w-8 h-4.5 rounded-full transition-colors duration-200 focus:outline-none ${
                  row.isAvailable
                    ? "bg-orange-500"
                    : D
                      ? "bg-[#2a2d3e]"
                      : "bg-gray-200"
                } ${toggling === row.statusDocId ? "opacity-50" : ""}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 ${
                    row.isAvailable ? "translate-x-3.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────
const Stations = () => {
  const { dark } = useTheme();
  const D = dark;

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  // ── Firestore real-time listener ───────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    const payload = JSON.parse(atob(token.split(".")[1]));
    const ownerId = payload.sub;

    const unsub = onSnapshot(
      query(collection(db, "stations"), where("owner_id", "==", ownerId)),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStations(items);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const validate = (form) => {
    if (!form.name.trim()) return "Station name is required";
    if (!form.city.trim()) return "City is required";
    if (!form.address.trim()) return "Address is required";
    if (form.latitude == null || form.longitude == null) return "Location coordinates are required";
    return null;
  };

  // ── Add ────────────────────────────────────────────────
  const handleAdd = async (form, imageFile) => {
    const err = validate(form);
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFormError("You are not logged in.");
        return;
      }
      const payload = JSON.parse(atob(token.split(".")[1]));

      let image_url = form.image_url || "";
      if (imageFile) image_url = await uploadToCloudinary(imageFile); // ← add

      await addDoc(collection(db, "stations"), {
        ...form,
        image_url, // ← add
        owner_id: payload.sub,
        created_at: new Date().toISOString(),
      });
      setIsAdding(false);
    } catch (e) {
      setFormError(e.message || "Failed to add station");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────
  const handleEdit = async (form, imageFile) => {
    const err = validate(form);
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      let image_url = form.image_url || "";
      if (imageFile) image_url = await uploadToCloudinary(imageFile); // ← add

      await updateDoc(doc(db, "stations", editingId), { ...form, image_url }); // ← image_url
      setEditingId(null);
    } catch (e) {
      setFormError(e.message || "Failed to update station");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "stations", id));
      setConfirmDel(null);
    } catch (e) {
      alert(e.message || "Failed to delete station");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Theme tokens ───────────────────────────────────────
  const bg = D ? "bg-[#0f1117]" : "bg-gray-50";
  const txt = D ? "text-gray-100" : "text-gray-900";
  const sub = D ? "text-gray-400" : "text-gray-500";

  if (loading)
    return (
      <div
        className={`flex items-center justify-center h-full min-h-[300px] ${bg}`}
      >
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div
      className={`flex-1 p-6 overflow-auto rounded-lg transition-colors duration-300 ${bg}`}
    >
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className={`text-xl font-semibold ${txt}`}>Stations</h1>
          <p className={`text-sm mt-0.5 ${sub}`}>
            {stations.length} station{stations.length !== 1 ? "s" : ""} · Manage
            your network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-colors ${D ? "bg-[#1a1d27] border-[#2a2d3e] text-gray-400 hover:text-gray-300" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <IconRefresh /> Refresh
          </button>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormError("");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <IconPlus /> Add Station
          </button>
        </div>
      </div>

      {/* ── Add Form ── */}
      {isAdding && (
        <StationForm
          title="Add New Station"
          onSave={handleAdd}
          onCancel={() => {
            setIsAdding(false);
            setFormError("");
          }}
          saving={saving}
          error={formError}
          D={D}
        />
      )}

      {/* ── Edit Form ── */}
      {editingId &&
        (() => {
          const stn = stations.find((s) => s.id === editingId);
          if (!stn) return null;
          const hasCoords = stn.latitude != null && stn.longitude != null;
          return (
            <>
              {!hasCoords && (
                <div className={`mb-4 p-3 rounded-xl border ${D ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
                  <p className="text-sm font-medium">⚠ This station has no coordinates.</p>
                  <p className="text-xs mt-1">It won't appear on the mobile app map until location is set.</p>
                </div>
              )}
              <StationForm
                title={`Edit — ${stn.name}`}
                initial={{
                  name: stn.name || "",
                  address: stn.address || "",
                  phone: stn.phone || "",
                  city: stn.city || "",
                  category: stn.category || "",
                  status: stn.status || "Active",
                  opening: stn.opening || "08:00",
                  closing: stn.closing || "18:00",
                  sun_off: stn.sun_off ?? true,
                  break_start: stn.break_start || "13:00",
                  break_end: stn.break_end || "14:00",
                  description: stn.description || "",
                  latitude: stn.latitude ?? null,
                  longitude: stn.longitude ?? null,
                  image_url: stn.image_url || "",
                }}
                onSave={handleEdit}
                onCancel={() => {
                  setEditingId(null);
                  setFormError("");
                }}
                saving={saving}
                error={formError}
                D={D}
              />
            </>
          );
        })()}

      {/* ── Station Cards Grid ── */}
      <div className="grid grid-cols-3 gap-4">
        {stations.length === 0 && !isAdding && (
          <EmptyState onAdd={() => setIsAdding(true)} D={D} />
        )}

        {stations.map((stn) => (
          <div
            key={stn.id}
            className={`border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors ${D ? "bg-[#1a1d27] border-[#2a2d3e]" : "bg-white border-gray-100"}`}
          >
            {/* Card Top — image or colored band */}
            {stn.image_url ? (
              <div className="relative">
                <img
                  src={stn.image_url}
                  alt={stn.name}
                  className="h-46 w-full object-cover"
                />
                {stn.city && (
                  <span
                    className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${D ? "bg-[#1a1d27] text-gray-300" : "bg-white text-gray-600"} shadow-sm`}
                  >
                    {stn.city}
                  </span>
                )}
                <span
                  className={`absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    stn.status === "Active"
                      ? D
                        ? "bg-green-500/20 text-green-400"
                        : "bg-green-50 text-green-600"
                      : D
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-yellow-50 text-yellow-600"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${stn.status === "Active" ? "bg-green-500" : "bg-yellow-500"}`}
                  />
                  {stn.status}
                </span>
              </div>
            ) : (
              <div
                className={`h-13 flex items-center justify-center relative ${D ? "bg-orange-500/10" : "bg-gradient-to-br from-orange-50 to-orange-100"}`}
              >
                {stn.city && (
                  <span
                    className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${D ? "bg-[#1a1d27] text-gray-300" : "bg-white text-gray-600"} shadow-sm`}
                  >
                    {stn.city}
                  </span>
                )}
                <span
                  className={`absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    stn.status === "Active"
                      ? D
                        ? "bg-green-500/20 text-green-400"
                        : "bg-green-50 text-green-600"
                      : D
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-yellow-50 text-yellow-600"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${stn.status === "Active" ? "bg-green-500" : "bg-yellow-500"}`}
                  />
                  {stn.status}
                </span>
              </div>
            )}

            {/* Card Body */}
            <div className="p-4 flex flex-col flex-1">
              {/* Name + Category */}
              <div className="mb-2">
                <p
                  className={`text-sm font-bold leading-tight ${D ? "text-gray-100" : "text-gray-900"}`}
                >
                  {stn.name}
                </p>
                {stn.category && (
                  <span
                    className={`text-xs font-medium mt-0.5 inline-block ${D ? "text-orange-400" : "text-orange-500"}`}
                  >
                    {stn.category}
                  </span>
                )}
              </div>

              {/* Address */}
              {stn.address && (
                <div
                  className={`flex items-start gap-1.5 text-xs mb-1.5 ${D ? "text-gray-400" : "text-gray-500"}`}
                >
                  <span className="mt-0.5 flex-shrink-0">
                    <IconLocation />
                  </span>
                  <span className="leading-relaxed">
                    {stn.address}
                    {stn.city ? `, ${stn.city}` : ""}
                  </span>
                </div>
              )}

              {/* Phone */}
              {stn.phone && (
                <div
                  className={`flex items-center gap-1.5 text-xs mb-1.5 ${D ? "text-gray-400" : "text-gray-500"}`}
                >
                  <IconPhone />
                  <span>{stn.phone}</span>
                </div>
              )}

              {/* Working Hours */}
              {stn.opening && (
                <div
                  className={`flex items-start gap-1.5 text-xs mb-1.5 ${D ? "text-gray-400" : "text-gray-500"}`}
                >
                  <span className="mt-0.5 flex-shrink-0">
                    <IconClock />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span>
                      Mon–Sat: {stn.opening} — {stn.closing}
                    </span>
                    <span>
                      Sunday:{" "}
                      {stn.sun_off ? (
                        <span
                          className={`${D ? "text-red-400" : "text-red-500"}`}
                        >
                          Closed
                        </span>
                      ) : (
                        "Open"
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Break Time */}
              {stn.break_start && (
                <div
                  className={`flex items-center gap-1.5 text-xs mb-1.5 ${D ? "text-gray-400" : "text-gray-500"}`}
                >
                  <IconBreakTime />
                  <span>
                    Break: {stn.break_start} — {stn.break_end}
                  </span>
                </div>
              )}

              {/* Description */}
              {stn.description && (
                <p
                  className={`text-xs leading-relaxed mt-2 mb-3 flex-1 ${D ? "text-gray-500" : "text-gray-400"}`}
                >
                  {stn.description}
                </p>
              )}

              {/* ── Services Panel ── */}
              <StationServicesPanel stationId={stn.id} D={D} />

              <div className="flex-1" />

              {/* Confirm Delete */}
              {confirmDel === stn.id ? (
                <div
                  className={`mt-auto pt-3 border-t ${D ? "border-[#2a2d3e]" : "border-gray-100"}`}
                >
                  <p
                    className={`text-xs font-medium mb-2 text-center ${D ? "text-red-400" : "text-red-500"}`}
                  >
                    Delete "{stn.name}"? This can't be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDel(null)}
                      className={`flex-1 px-2 py-1.5 border rounded-lg text-xs font-medium transition-colors ${D ? "border-[#2a2d3e] text-gray-500 hover:bg-[#2a2d3e]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(stn.id)}
                      disabled={deletingId === stn.id}
                      className="flex-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
                    >
                      {deletingId === stn.id ? "Deleting…" : "Yes, Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-2 pt-3 border-t mt-auto ${D ? "border-[#2a2d3e]" : "border-gray-100"}`}
                >
                  <button
                    onClick={() => {
                      setEditingId(stn.id);
                      setIsAdding(false);
                      setFormError("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border rounded-lg text-xs font-medium transition-colors ${D ? "border-[#2a2d3e] text-gray-400 hover:bg-[#2a2d3e]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    <IconEdit /> Edit
                  </button>
                  <button
                    onClick={() => setConfirmDel(stn.id)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border rounded-lg text-xs font-medium transition-colors ${D ? "border-red-500/50 text-red-400 hover:bg-red-500/10" : "border-red-100 text-red-500 hover:bg-red-50"}`}
                  >
                    <IconTrash /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stations;
