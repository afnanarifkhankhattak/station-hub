import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../api/api";
import { useTheme } from "../../context/theme.Context";
import { db } from "../../firebase";
// replace your existing firestore import line with this
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

// ── cloudinary setUp ──────────────────────────────────────────────
// const CLOUDINARY_CLOUD_NAME = "dgq7ielys"; // ← replace
const CLOUDINARY_CLOUD_NAME = "dqlmva24c"; // ← replace
const CLOUDINARY_UPLOAD_PRESET = "StationHub"; // ← replace

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
const IconBarChart = () => (
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
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
const IconStar = () => (
  <svg className="w-3 h-3 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const IconClock = () => (
  <svg
    className="w-3 h-3"
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
const IconCar = () => (
  <svg
    className="w-8 h-8 text-orange-300 opacity-40"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 6H5l-2 6v3h14v-3l-2-6H9m4 0V4"
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
/////////////////////////////////////////////////////////////////////////////////////////
// ── Empty state ────────────────────────────────────────────
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
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    </div>
    <p
      className={`text-sm font-semibold mb-1 ${D ? "text-gray-200" : "text-gray-700"}`}
    >
      No services yet
    </p>
    <p className={`text-xs mb-4 ${D ? "text-gray-500" : "text-gray-400"}`}>
      Add your first service to start receiving bookings
    </p>
    <button
      onClick={onAdd}
      className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-colors"
    >
      <IconPlus /> Add First Service
    </button>
  </div>
);

// ── Service Form ───────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  description: "",
  status: "Active",
  rating: "",
  image_url: "",
  station_ids: [],
  categories: {},
};
/////////////////////////////////////////////////////////////////////////////////////////

const ServiceForm = ({
  initial = EMPTY_FORM,
  onSave,
  onCancel,
  saving,
  error,
  title,
  D,
  stations = [],
}) => {
  const [form, setForm] = useState(initial);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial.image_url || "");
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const lbl = D ? "text-gray-400" : "text-gray-600";
  const inp = D
    ? "bg-[#1a1d27] border-[#2a2d3e] text-gray-100 focus:border-orange-500"
    : "bg-white border-gray-200 text-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

  return (
    <div
      className={`border rounded-2xl shadow-sm overflow-hidden mb-4 ${D ? "bg-[#1a1d27] border-[#2a2d3e]" : "bg-white border-orange-200"}`}
    >
      <div
        className={`flex items-center justify-between px-5 py-4 border-b ${D ? "bg-orange-500/10 border-[#2a2d3e]" : "border-gray-100 bg-orange-50/40"}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
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
          className={`w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors ${D ? "text-gray-500 hover:bg-[#2a2d3e]" : "text-gray-400 hover:text-gray-600"}`}
        >
          <IconX />
        </button>
      </div>

      <div className="p-5">
        {error && (
          <div
            className={`mb-4 px-3 py-2 rounded-lg text-xs ${D ? "bg-red-500/20 border border-red-500/50 text-red-400" : "bg-red-50 border border-red-100 text-red-500"}`}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {/* ── Station multi-select ── */}
          <div className="col-span-3">
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              Stations <span className="text-red-500">*</span>
            </label>

            {stations.length === 0 ? (
              <p
                className={`text-[11px] mt-1 ${D ? "text-gray-600" : "text-gray-400"}`}
              >
                No stations found. Add a station first.
              </p>
            ) : (
              <div
                className={`w-full px-3 py-2 text-sm border rounded-xl ${inp} space-y-1.5 max-h-40 overflow-y-auto`}
              >
                {stations.map((station) => (
                  <label
                    key={station.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={station.id}
                      checked={form.station_ids?.includes(station.id)}
                      onChange={(e) => {
                        const current = form.station_ids || [];
                        if (e.target.checked) {
                          set("station_ids", [...current, station.id]);
                        } else {
                          set(
                            "station_ids",
                            current.filter((id) => id !== station.id),
                          );
                        }
                      }}
                      className="accent-blue-500"
                    />
                    <span>{station.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Service Name */}
          <div className="col-span-2">
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              Service Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Premium Detail"
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
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-all ${inp}`}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          {/* CAR CATEGORY PRICING */}
          <div className="col-span-3 mt-2">
            <div className={`p-4 rounded-xl border ${D ? "border-[#2a2d3e] bg-[#1a1c23]" : "border-gray-200 bg-white"}`}>
              <label className={`block text-xs font-bold mb-2 ${lbl}`}>
                Car Categories Pricing
              </label>
              
              {CAR_CATEGORIES.map((cat) => (
                <div key={cat.id} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={!!form.categories?.[cat.id]}
                      onChange={(e) => {
                        const categories = { ...form.categories };
                        if (e.target.checked) {
                          categories[cat.id] = { price: "" };
                        } else {
                          delete categories[cat.id];
                        }
                        set("categories", categories);
                      }}
                      className="accent-orange-500"
                      id={`cat-${cat.id}`}
                    />
                    <label htmlFor={`cat-${cat.id}`} className="text-sm font-medium cursor-pointer">{cat.label}</label>
                  </div>

                  {form.categories?.[cat.id] && <div className="ml-6 mt-2 max-w-xs">
                    <label className={`block text-[10px] uppercase font-bold mb-1 ${lbl}`}>Price (PKR)</label>
                    <input type="number" min="0" value={form.categories[cat.id].price} onChange={(e) => {
                      const categories = { ...form.categories, [cat.id]: { ...form.categories[cat.id], price: e.target.value } };
                      set("categories", categories);
                    }} placeholder="2500" className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${inp}`} />
                  </div>}
                </div>
              ))}
            </div>
          </div>

          {/* BIKE CATEGORY PRICING */}
          <div className="col-span-3 mt-2">
            <div className={`p-4 rounded-xl border ${D ? "border-[#2a2d3e] bg-[#1a1c23]" : "border-gray-200 bg-white"}`}>
              <label className={`block text-xs font-bold mb-2 ${lbl}`}>
                Bike Categories Pricing
              </label>
              
              {BIKE_CATEGORIES.map((cat) => (
                <div key={cat.id} className="mb-4 last:mb-0">
                  <div className="flex items-start gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={!!form.categories?.[cat.id]}
                      onChange={(e) => {
                        const categories = { ...form.categories };
                        if (e.target.checked) {
                          categories[cat.id] = { price: "" };
                        } else {
                          delete categories[cat.id];
                        }
                        set("categories", categories);
                      }}
                      className="accent-orange-500 mt-1"
                      id={`cat-${cat.id}`}
                    />
                    <label htmlFor={`cat-${cat.id}`} className="cursor-pointer">
                      <span className="block text-sm font-medium">{cat.label}</span>
                      <span className={`block text-[11px] mt-0.5 ${D ? "text-gray-500" : "text-gray-400"}`}>
                        {cat.example}
                      </span>
                    </label>
                  </div>

                  {form.categories?.[cat.id] && <div className="ml-6 mt-2 max-w-xs">
                    <label className={`block text-[10px] uppercase font-bold mb-1 ${lbl}`}>Price (PKR)</label>
                    <input type="number" min="0" value={form.categories[cat.id].price} onChange={(e) => {
                      const categories = { ...form.categories, [cat.id]: { ...form.categories[cat.id], price: e.target.value } };
                      set("categories", categories);
                    }} placeholder="800" className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${inp}`} />
                  </div>}
                </div>
              ))}
            </div>
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
              placeholder="Describe your service briefly..."
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-all resize-none ${inp}`}
            />
          </div>

          {/* Image upload */}
          <div className="col-span-3">
            <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
              Service Image (optional)
            </label>
            <div
              className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                D
                  ? "border-[#2a2d3e] hover:border-orange-500/50 bg-[#0f1117]"
                  : "border-gray-200 hover:border-orange-300 bg-gray-50"
              }`}
              onClick={() =>
                document.getElementById("service-image-input").click()
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
              id="service-image-input"
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

        <div
          className={`flex items-center justify-end gap-3 mt-5 pt-4 border-t ${D ? "border-[#2a2d3e]" : "border-gray-100"}`}
        >
          <button
            onClick={onCancel}
            className={`px-4 py-2 text-sm font-medium border rounded-xl transition-colors ${D ? "text-gray-500 border-[#2a2d3e] hover:bg-[#2a2d3e]" : "text-gray-500 hover:text-gray-700 border-gray-200 hover:bg-gray-50"}`}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form, imageFile)}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />{" "}
                Saving…
              </>
            ) : (
              "Save Service"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Constants ──────────────────────────────────────────────
const CAR_CATEGORIES = [
  { id: "sedan", label: "Sedan (e.g. Corolla, Civic)" },
  { id: "hatchback", label: "Hatchback (e.g. Alto, Cultus)" },
  { id: "suv", label: "SUV/Crossover (e.g. BR-V, Seltos)" },
  { id: "full_suv", label: "Full SUV (e.g. Land Cruiser, Prado)" },
  { id: "pickup", label: "Pickup/LCV (e.g. Bolan, Hilux)" },
];

const BIKE_CATEGORIES = [
  {
    id: "economy_bike",
    label: "Economy",
    example: "e.g., Honda CD 70, CG 125, United US 100",
  },
  {
    id: "standard_bike",
    label: "Standard",
    example: "e.g., Yamaha YBR 125, Honda CB 125F",
  },
  {
    id: "premium_bike",
    label: "Premium",
    example: "e.g., Honda CB 150F, Benelli 150i",
  },
];

const CATEGORY_LABELS = Object.fromEntries(
  [...CAR_CATEGORIES, ...BIKE_CATEGORIES].map((c) => [c.id, c.label]),
);

////////////////////////////////////////////////////////////////////////////////
// ── Main Component ─────────────────────────────────────────
const Services = () => {
  const [services, setServices] = useState([]);
  const [stations, setStations] = useState([]); // ← new
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const { dark } = useTheme();

  // ── Fetch stations once ───────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const ownerId = payload.sub;

    const unsub = onSnapshot(
      query(collection(db, "stations"), where("owner_id", "==", ownerId)),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStations(items);
      },
      () => setStations([]),
    );

    return () => unsub();
  }, []);

  // ── Fetch services ────────────────────────────────────
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/services/");
      setServices(data.services || []);
    } catch (e) {
      setError(e.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const validate = (form) => {
    if (!form.name.trim()) return "Service name is required";
    
    const hasCategories = Object.keys(form.categories || {}).length > 0;
    if (!hasCategories) return "Select at least one vehicle category (car or bike)";
    
    if (hasCategories) {
      for (const cat of Object.keys(form.categories)) {
        const catData = form.categories[cat];
        const catLabel = CATEGORY_LABELS[cat] || cat;
        if (!catData.price) return `Price is required for ${catLabel}`;
        if (isNaN(Number(catData.price)) || Number(catData.price) <= 0)
          return `Enter a valid positive price for ${catLabel}`;
      }
    }
    
    return null;
  };

  const buildPayload = (form, imageUrl) => {
    const categories = {};
    if (form.categories) {
      for (const cat of Object.keys(form.categories)) {
        categories[cat] = { price: Number(form.categories[cat].price) };
      }
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      rating: form.rating ? Number(form.rating) : null,
      image_url: imageUrl,
      station_ids: form.station_ids || [],
    };

    payload.categories = categories;

    return payload;
  };

  // Creates / removes serviceStationStatus docs when a service is saved
  const syncStationStatus = async (
    serviceId,
    newStationIds,
    oldStationIds = [],
  ) => {
    const token = localStorage.getItem("token");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const ownerId = payload.sub;

    // stations that were added → create a doc with isAvailable: true
    const added = newStationIds.filter((id) => !oldStationIds.includes(id));
    // stations that were removed → delete their doc
    const removed = oldStationIds.filter((id) => !newStationIds.includes(id));

    const writes = [
      ...added.map((stationId) => {
        const docRef = doc(
          db,
          "serviceStationStatus",
          `${serviceId}_${stationId}`,
        );
        return setDoc(docRef, {
          serviceId,
          stationId,
          ownerId,
          isAvailable: true,
        });
      }),
      ...removed.map((stationId) => {
        const docRef = doc(
          db,
          "serviceStationStatus",
          `${serviceId}_${stationId}`,
        );
        return deleteDoc(docRef);
      }),
    ];

    await Promise.all(writes);
  };

  const handleAdd = async (form, imageFile) => {
    const err = validate(form);
    if (err) {
      setFormError(err);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      let imageUrl = form.image_url || "";
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile);

      const data = await api.post("/services/", buildPayload(form, imageUrl));
      const newService = data.service;

      // sync station status docs for the new service
      await syncStationStatus(newService.id, form.station_ids || []);

      setServices((prev) => [newService, ...prev]);
      setIsAdding(false);
    } catch (e) {
      setFormError(e.message || "Failed to add service");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form, imageFile) => {
    const err = validate(form);
    if (err) {
      setFormError(err);
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      let imageUrl = form.image_url || "";
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile);

      const data = await api.put(
        `/services/${editingId}`,
        buildPayload(form, imageUrl),
      );

      // old station_ids come from the service currently in state
      const oldStationIds =
        services.find((s) => s.id === editingId)?.station_ids || [];
      await syncStationStatus(editingId, form.station_ids || [], oldStationIds);

      setServices((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, ...data.service } : s)),
      );
      setEditingId(null);
    } catch (e) {
      setFormError(e.message || "Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      alert(e.message || "Failed to delete service");
    } finally {
      setDeletingId(null);
      setConfirmDel(null);
    }
  };

  // ── Theme tokens ───────────────────────────────────────
  const D = dark;
  const bg = D ? "bg-[#0f1117]" : "bg-gray-50";
  const txt = D ? "text-gray-100" : "text-gray-900";
  const sub = D ? "text-gray-400" : "text-gray-500";

  if (loading)
    return (
      <div
        className={`flex items-center justify-center h-full min-h-[300px] rounded-lg ${bg}`}
      >
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div
      className={`flex-1 p-6 overflow-auto rounded-lg transition-colors duration-300 ${bg}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className={`text-xl font-semibold ${txt}`}>My Services</h1>
          <p className={`text-sm mt-0.5 ${sub}`}>
            {services.length} service{services.length !== 1 ? "s" : ""} · Manage
            what you offer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchServices}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs text-gray-600 transition-colors ${D ? "bg-[#1a1d27] border-[#2a2d3e] text-gray-400 hover:text-gray-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}
          >
            <IconRefresh /> Refresh
          </button>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormError("");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <IconPlus /> Add New
          </button>
        </div>
      </div>

      {error && (
        <div
          className={`mb-4 px-4 py-3 border rounded-xl text-sm ${D ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-red-50 border-red-200 text-red-500"}`}
        >
          {error}
        </div>
      )}

      {isAdding && (
        <ServiceForm
          title="Add New Service"
          onSave={handleAdd}
          onCancel={() => {
            setIsAdding(false);
            setFormError("");
          }}
          saving={saving}
          error={formError}
          D={D}
          stations={stations} // ← passed down
        />
      )}

      {editingId &&
        (() => {
          const svc = services.find((s) => s.id === editingId);
          if (!svc) return null;
          return (
            <ServiceForm
              title={`Edit — ${svc.name}`}
              initial={{
                name: svc.name || "",
                description: svc.description || "",
                status: svc.status || "Active",
                rating: svc.rating || "",
                image_url: svc.image_url || "",
                station_ids: svc.station_ids || [],
                categories: Object.fromEntries(Object.entries(svc.categories || {}).map(([key, value]) => [key, { price: value.price ?? value.base?.price ?? value.premium?.price ?? "" }])),
              }}
              onSave={handleEdit}
              onCancel={() => {
                setEditingId(null);
                setFormError("");
              }}
              saving={saving}
              error={formError}
              D={D}
              stations={stations} // ← passed down
            />
          );
        })()}

      <div className="grid grid-cols-3 gap-4">
        {services.length === 0 && !isAdding && (
          <EmptyState onAdd={() => setIsAdding(true)} D={D} />
        )}

        {services.map((svc) => {
          // Resolve station name for display on the card
          const stationNames = (svc.station_ids || [])
            .map((id) => stations.find((st) => st.id === id)?.name)
            .filter(Boolean);

          return (
            // <div
            //   key={svc.id}
            //   className={`border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors ${D ? "bg-[#1a1d27] border-[#2a2d3e]" : "bg-white border-gray-100"}`}
            // >
            <div
              key={svc.id}
              className={`relative border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors ${D ? "bg-[#1a1d27] border-[#2a2d3e]" : "bg-white border-gray-100"}`}
            >
              {/* Unavailable overlay */}
              {svc.status === "Unavailable" && (
                <div
                  className={`absolute inset-0 z-10 rounded-2xl flex items-center justify-center ${D ? "bg-[#0f1117]/70" : "bg-white/70"} backdrop-blur-[1.2px]`}
                >
                  <div className={`flex flex-col items-center  gap-1.5`}>
                    <span
                      className={`  text-xs  font-semibold px-3 py-1.5 rounded-full border ${D ? "bg-[#1a1d27] text-gray-400 border-[#FF6A00]" : "bg-white text-gray-400 border-[#FF6A00]"}`}
                    >
                      Unavailable
                    </span>
                  </div>
                </div>
              )}
              {svc.image_url ? (
                <img
                  src={svc.image_url}
                  alt={svc.name}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div
                  className={`h-36 flex items-center justify-center ${D ? "bg-orange-500/10" : "bg-gradient-to-br from-orange-50 to-orange-100"}`}
                >
                  <IconCar />
                </div>
              )}

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p
                    className={`text-sm font-bold leading-tight ${D ? "text-gray-100" : "text-gray-900"}`}
                  >
                    {svc.name}
                  </p>
                  <span
                    // className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 ${
                    //   svc.status === "Active"
                    //     ? D
                    //       ? "bg-green-500/20 text-green-400"
                    //       : "bg-green-50 text-green-600"
                    //     : D
                    //       ? "bg-yellow-500/20 text-yellow-400"
                    //       : "bg-yellow-50 text-yellow-600"
                    // }`}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 ${
                      svc.status === "Active"
                        ? D
                          ? "bg-green-500/20 text-green-400"
                          : "bg-green-50 text-green-600"
                        : svc.status === "Unavailable"
                          ? D
                            ? "bg-gray-500/20 text-gray-400"
                            : "bg-gray-100 text-gray-400"
                          : D
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-yellow-50 text-yellow-600"
                    }`}
                  >
                    {/* <span
                      className={`w-1.5 h-1.5 rounded-full ${svc.status === "Active" ? "bg-green-500" : "bg-yellow-500"}`}
                    /> */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        svc.status === "Active"
                          ? "bg-green-500"
                          : svc.status === "Unavailable"
                            ? "bg-gray-400"
                            : "bg-yellow-500"
                      }`}
                    />
                    {svc.status}
                  </span>
                </div>

                {Object.keys(svc.categories || {}).length > 0 && (
                  <div className="space-y-1 mb-2">
                    {Object.entries(svc.categories).map(([category, pricing]) =>
                      pricing?.price != null ? (
                        <div
                          key={category}
                          className={`flex items-center gap-3 text-xs ${D ? "text-gray-400" : "text-gray-500"}`}
                        >
                          <span
                            className={`font-medium capitalize ${D ? "text-gray-300" : "text-gray-600"}`}
                          >
                            {CATEGORY_LABELS[category] || category.replace(/_/g, " ")}:
                          </span>
                          <span className="font-semibold text-orange-500">
                            PKR {Number(pricing.price).toLocaleString()}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </div>
                )}

                {svc.rating && (
                  <div
                    className={`flex items-center gap-1 text-xs mb-2 ${D ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <IconStar />
                    <span
                      className={`font-medium ${D ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {Number(svc.rating).toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Station badge on card
                {stationNames.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <svg
                      className="w-3 h-3 flex-shrink-0"
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
                    {stationNames.map((name, i) => (
                      <span
                        key={i}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${D ? "bg-orange-500/15 text-orange-400" : "bg-orange-50 text-orange-600"}`}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )} */}

                {svc.description && (
                  <p
                    className={`text-xs leading-relaxed mb-3 flex-1 ${D ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {svc.description}
                  </p>
                )}

                <div className="flex-1" />

                {confirmDel === svc.id ? (
                  <div
                    className={`mt-auto pt-3 border-t ${D ? "border-[#2a2d3e]" : "border-gray-100"}`}
                  >
                    <p
                      className={`text-xs font-medium mb-2 text-center ${D ? "text-red-400" : "text-red-500"}`}
                    >
                      Delete "{svc.name}"? This can't be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDel(null)}
                        className={`flex-1 px-2 py-1.5 border rounded-lg text-xs font-medium transition-colors ${D ? "border-[#2a2d3e] text-gray-500 hover:bg-[#2a2d3e]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(svc.id)}
                        disabled={deletingId === svc.id}
                        className="flex-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
                      >
                        {deletingId === svc.id ? "Deleting…" : "Yes, Delete"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-2 pt-3 border-t mt-auto ${D ? "border-[#2a2d3e]" : "border-gray-100"}`}
                  >
                    <button
                      onClick={() => {
                        setEditingId(svc.id);
                        setIsAdding(false);
                        setFormError("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border rounded-lg text-xs font-medium transition-colors ${D ? "border-[#2a2d3e] text-gray-400 hover:bg-[#2a2d3e]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      <IconEdit /> Edit
                    </button>
                    <button
                      onClick={() => setConfirmDel(svc.id)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border rounded-lg text-xs font-medium transition-colors ${D ? "border-red-500/50 text-red-400 hover:bg-red-500/10" : "border-red-100 text-red-500 hover:bg-red-50"}`}
                    >
                      <IconTrash /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Services;
