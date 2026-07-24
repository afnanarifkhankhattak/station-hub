const BASE_URL = import.meta.env.VITE_API_URL;
console.log("API BASE URL:", import.meta.env.VITE_API_URL);

const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

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
  const parsed = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(parsed.detail || `Request failed: ${res.status}`);
  return parsed;
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
};
