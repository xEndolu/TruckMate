import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

console.log("API_BASE_URL:", API_BASE_URL);

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export const API_ENDPOINTS = {
  // Main API endpoints
  login: `${API_BASE_URL}/api/login/`,
  register: `${API_BASE_URL}/api/register/`,
  verifyOtp: `${API_BASE_URL}/api/verify-otp/`,
  user: `${API_BASE_URL}/api/user/`,
  chatbot: `${API_BASE_URL}/api/chatbot/`,
  userProfile: `${API_BASE_URL}/api/user-profile/`,

  // Admin endpoints
  adminDashboard: `${API_BASE_URL}/api/admin-dashboard/`,
  customAdminDashboard: `${API_BASE_URL}/custom-admin-dashboard/`,

  // Other endpoints
  home: `${API_BASE_URL}/`,
  assessDamage: `${API_BASE_URL}/assess_damage/`,
  getUserData: `${API_BASE_URL}/api/user/`,
};

console.log("API_ENDPOINTS:", API_ENDPOINTS);

export default API_ENDPOINTS;
