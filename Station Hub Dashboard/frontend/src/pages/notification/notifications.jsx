import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/theme.Context";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore'
import { db } from "../../firebase"; // adjust path to your firebase config

// ── SVG Icons ─────────────────────────────────────────────
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
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5.001M9 17H4l1.405-1.405A2.032 2.032 0 006 14.158V11a6 6 0 0112 0v3.159c0 .538.214 1.055.595 1.436L20 17h-5m-6 0v1a3 3 0 006 0v-1m-6 0h6"
    />
  </svg>
);
const IconCar = () => (
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
      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 6l2.293 2.293a1 1 0 00.414.242l3.647.913A1 1 0 0120 10.43V15a1 1 0 01-1 1h-1M6 15H3a1 1 0 01-1-1v-4.43a1 1 0 01.646-.943l3.647-.913a1 1 0 00.414-.242L9 6h4z"
    />
  </svg>
);
const IconCheck = () => (
  <svg
    className="w-3 h-3"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IconCheckAll = () => (
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
      d="M4 12l4 4L19 7M9 17l-5-5"
    />
  </svg>
);
const IconFilter = () => (
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
      d="M3 4h18M7 8h10M10 12h4"
    />
  </svg>
);
const IconCalendar = () => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const IconUser = () => (
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
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const IconEmpty = () => (
  <svg
    className="w-10 h-10"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

// ── Helpers ────────────────────────────────────────────────
const timeAgo = (ts) => {
  if (!ts) return "";
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatDate = (str) => {
  if (!str) return "—";
  const d = new Date(str);
  return isNaN(d)
    ? str
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const serviceIcon = (service = "") => {
  const s = service.toLowerCase();
  if (s.includes("full") || s.includes("detail")) return "✦";
  if (s.includes("interior")) return "🪑";
  if (s.includes("exterior") || s.includes("wash")) return "💧";
  if (s.includes("polish") || s.includes("wax")) return "✨";
  return "🚗";
};

const statusBadge = (status = "pending", D) => {
  const map = {
    pending: {
      label: "Pending",
      cls: D
        ? "bg-yellow-500/15 text-yellow-400"
        : "bg-yellow-50 text-yellow-600",
    },
    confirmed: {
      label: "Confirmed",
      cls: D ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600",
    },
    completed: {
      label: "Completed",
      cls: D ? "bg-green-500/15 text-green-400" : "bg-green-50 text-green-600",
    },
    cancelled: {
      label: "Cancelled",
      cls: D ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-600",
    },
  };
  const { label, cls } = map[status] || map.pending;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
};

// ── Main Component ─────────────────────────────────────────
const Notifications = () => {
  const { dark: D } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unread"); // all | unread | read

  // ── Firestore real-time listener ───────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const ownerId = payload.sub;

    const stationsUnsub = onSnapshot(
      query(collection(db, "stations"), where("owner_id", "==", ownerId)),
      (stationSnap) => {
        const stationIds = stationSnap.docs.map((d) => d.id);

        if (stationIds.length === 0) {
          setNotifications([]);
          setLoading(false);
          return;
        }

        const bookingsQuery = query(
          collection(db, "bookings"),
          where("station_id", "in", stationIds),
        );

        onSnapshot(
          bookingsQuery,
          async (snapshot) => {
            const userCache = {};
            const serviceCache = {};

            const items = await Promise.all(
              snapshot.docs.map(async (d) => {
                const data = d.data();
                const userId = data.user_id || "";
                const serviceId = data.service_id || "";

                // ── User lookup (name + profile image) ──
                let userName = "Unknown User";
                let userProfileImage = "";
                if (userId) {
                  if (!userCache[userId]) {
                    const userSnap = await getDocs(
                      query(collection(db, "users"), where("__name__", "==", userId)),
                    );
                    userCache[userId] = userSnap.empty ? null : userSnap.docs[0].data();
                  }
                  if (userCache[userId]) {
                    userName = userCache[userId].full_name || "Unknown User";
                    userProfileImage = userCache[userId].profile_image || "";
                  }
                }

                // ── Service lookup (name) ──
                let serviceName = "Service";
                if (serviceId) {
                  if (!serviceCache[serviceId]) {
                    const serviceSnap = await getDocs(
                      query(collection(db, "services"), where("__name__", "==", serviceId)),
                    );
                    serviceCache[serviceId] = serviceSnap.empty ? null : serviceSnap.docs[0].data();
                  }
                  if (serviceCache[serviceId]) {
                    serviceName = serviceCache[serviceId].name || "Service";
                  }
                }

                return {
                  id: d.id,
                  read: data.dashboardRead ?? false,
                  userName,
                  userProfileImage,
                  service: serviceName,
                  date: data.travel_date || "",
                  time: data.travel_time || "",
                  vehicleType: data.vehicle_type || "",
                  vehicleBrand: data.vehicle_brand || "",
                  vehicleNumber: data.vehicle_number || "",
                  serviceId,
                  stationId: data.station_id || "",
                  userId,
                  status: data.status || "pending",
                  createdAt: data.created_at || data.createdAt,
                };
              }),
            );

            setNotifications(items);
            setLoading(false);
          },
          (err) => {
            console.error("Firestore error:", err);
            setLoading(false);
          },
        );
      },
    );

    return () => stationsUnsub();
  }, []);

  // ── Mark one as read ───────────────────────────────────
  const markRead = async (id) => {
    try {
      await updateDoc(doc(db, "bookings", id), { dashboardRead: true });
    } catch (e) {
      console.error(e);
    }
  };

  // ── Mark all as read ───────────────────────────────────
  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach((n) =>
      batch.update(doc(db, "bookings", n.id), { dashboardRead: true }),
    );
    try {
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  // ── Filtered list ──────────────────────────────────────
  const visible = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Theme tokens (mirrors Profile.jsx) ────────────────
  const bg = D ? "bg-[#0f1117]" : "bg-gray-50";
  const card = D ? "bg-[#1a1d27] border-[#2a2d3e]" : "bg-white border-gray-100";
  const head = D ? "border-[#2a2d3e]" : "border-gray-100";
  const txt = D ? "text-gray-100" : "text-gray-900";
  const sub = D ? "text-gray-400" : "text-gray-500";
  const hint = D ? "text-gray-600" : "text-gray-400";

  // ── Loading ────────────────────────────────────────────
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
      {/* ── Page Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-xl font-semibold ${txt}`}>Notifications</h1>
          <p className={`text-sm mt-0.5 ${sub}`}>
            {unreadCount > 0
              ? `${unreadCount} new booking${unreadCount > 1 ? "s" : ""} since your last visit`
              : "All caught up — no new bookings"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
              D
                ? "text-gray-300 border-[#2a2d3e] hover:bg-[#2a2d3e]"
                : "text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <IconCheckAll /> Mark all read
          </button>
        )}
      </div>

      {/* ── Main Card ── */}
      <div
        className={`border rounded-2xl shadow-sm overflow-hidden max-w-4xl ${card}`}
      >
        {/* Card Header + Filter tabs */}
        <div
          className={`flex items-center justify-between gap-4 px-5 py-3.5 border-b ${head}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-orange-500">
              <IconBell />
            </span>
            <p className={`text-sm font-semibold ${txt}`}>Booking Alerts</p>
            {unreadCount > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Filter Pills */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border ${D ? "bg-[#0f1117] border-[#2a2d3e]" : "bg-gray-50 border-gray-200"}`}
          >
            {["all", "unread", "read"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-medium px-3 py-1 rounded-lg transition-all capitalize cursor-pointer ${
                  filter === f
                    ? "bg-orange-500 text-white shadow-sm"
                    : D
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f}
                {f === "unread" && unreadCount > 0 && ` (${unreadCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Notification List ── */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className={hint}>
              <IconEmpty />
            </span>
            <p className={`text-sm font-medium ${sub}`}>
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </p>
            <p className={`text-xs ${hint}`}>
              New bookings will appear here in real time
            </p>
          </div>
        ) : (
          <ul
            className="divide-y divide-inherit"
            style={{ borderColor: D ? "#2a2d3e" : "#f3f4f6" }}
          >
            {visible.map((n, i) => (
              <li
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer group ${
                  !n.read
                    ? D
                      ? "bg-orange-500/5 hover:bg-orange-500/10"
                      : "bg-orange-50/60 hover:bg-orange-50"
                    : D
                      ? "hover:bg-[#0f1117]"
                      : "hover:bg-gray-50/60"
                }`}
              >
                {/* Avatar bubble */}
                {n.userProfileImage ? (
                  <img
                    src={n.userProfileImage}
                    alt={n.userName}
                    className="flex-shrink-0 w-9 h-9 rounded-xl object-cover mt-0.5"
                  />
                ) : (
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base mt-0.5 ${
                      !n.read
                        ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                        : D
                          ? "bg-[#2a2d3e] text-gray-400"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {serviceIcon(n.service)}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-sm font-semibold leading-snug ${txt}`}
                      >
                        New Booking
                        {!n.read && (
                          <span className="ml-2 inline-block w-1.5 h-1.5 bg-orange-500 rounded-full align-middle" />
                        )}
                      </p>
                      {statusBadge(n.status, D)}
                    </div>
                    <span className={`text-xs flex-shrink-0 ${hint}`}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className={`text-xs mt-1 ${sub}`}>
                    <span className="font-medium text-orange-500">
                      {n.userName}
                    </span>{" "}
                    booked{" "}
                    <span className={`font-medium ${txt}`}>{n.service}</span>
                  </p>

                  {/* Vehicle row */}
                  {n.vehicleBrand && (
                    <div
                      className={`flex items-center gap-1.5 mt-1.5 text-xs ${sub}`}
                    >
                      <IconCar />
                      <span>
                        {n.vehicleType} — {n.vehicleBrand} {n.vehicleNumber}
                      </span>
                    </div>
                  )}

                  {/* Meta row */}
                  <div
                    className={`flex items-center gap-4 mt-1.5 flex-wrap text-xs ${hint}`}
                  >
                    {n.date && (
                      <span className="flex items-center gap-1">
                        <IconCalendar />
                        {formatDate(n.date)}
                        {n.time && ` · ${n.time}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Read indicator dot */}
                {!n.read && (
                  <div className="flex-shrink-0 mt-1.5">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Footer count */}
        {visible.length > 0 && (
          <div
            className={`px-5 py-3 border-t flex items-center justify-between ${head}`}
          >
            <p className={`text-xs ${hint}`}>
              Showing {visible.length} of {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className={`text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors cursor-pointer`}
              >
                View all
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
