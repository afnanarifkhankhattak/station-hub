// Station Hub Dashboard — API client

const BASE_URL = import.meta.env.VITE_API_URL;

if (import.meta.env.DEV) {
  console.log("API BASE URL:", BASE_URL);
}

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

const request = async (method, endpoint, data) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  const text = await res.text();
  let parsed = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { detail: text.slice(0, 200) };
    }
  }

  if (!res.ok) {
    throw new Error(parsed.detail || `Request failed: ${res.status}`);
  }
  return parsed ?? {};
};

export const api = {
  post: (endpoint, data) => request("POST", endpoint, data),
  get: (endpoint) => request("GET", endpoint),
  put: (endpoint, data) => request("PUT", endpoint, data),
  delete: (endpoint) => request("DELETE", endpoint),
  patch: (endpoint, data) => request("PATCH", endpoint, data),

  auth: {
    register: (full_name, email, password, phone = "") =>
      api.post("/auth/register", { full_name, email, password, phone }),
    login: (email, password) => api.post("/auth/login", { email, password }),
    forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
    verifyOTP: (email, otp) => api.post("/auth/verify-otp", { email, otp }),
    resetPassword: (email, otp, new_password) =>
      api.post("/auth/reset-password", { email, otp, new_password }),
    changePassword: (old_password, new_password) =>
      api.post("/auth/change-password", { old_password, new_password }),
    googleLogin: (id_token) => api.post("/auth/google", { id_token }),
  },

  admin: {
    // ─── Platform stats ──────────────────────────────────
    getStats: () => api.get("/admin/stats"),

    // ─── Stations ────────────────────────────────────────
    getStations: (params = {}) => {
      const q = new URLSearchParams(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== null && v !== ""
        )
      ).toString();
      return api.get(`/admin/stations${q ? `?${q}` : ""}`);
    },

    updateStationStatus: (stationId, status, reason = "") =>
      api.patch(`/admin/stations/${stationId}/status`, { status, reason }),

    // ─── Users ───────────────────────────────────────────
    getUsers: (params = {}) => {
      const q = new URLSearchParams(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== null && v !== ""
        )
      ).toString();
      return api.get(`/admin/users${q ? `?${q}` : ""}`);
    },

    updateUserStatus: (userId, status, reason = "") =>
      api.patch(`/admin/users/${userId}/status`, { status, reason }),

    // ─── Reviews ─────────────────────────────────────────
    reviews: {
      list: (params = {}) => {
        const q = new URLSearchParams(
          Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== null && v !== ""
          )
        ).toString();
        return api.get(`/reviews/admin/list${q ? `?${q}` : ""}`);
      },

      moderate: (reviewId, hidden, reason = "") =>
        api.patch(`/reviews/admin/${reviewId}/moderate`, { hidden, reason }),
    },
  },
};