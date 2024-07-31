// src/axiosConfig.js

import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

console.log("Configuring axios with BASE_URL:", API_BASE_URL);

axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL;

// Add request interceptor for logging
axios.interceptors.request.use(
  function (config) {
    console.log("Making request to:", config.url);
    return config;
  },
  function (error) {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
axios.interceptors.response.use(
  function (response) {
    console.log(
      "Received response from:",
      response.config.url,
      "Status:",
      response.status
    );
    return response;
  },
  function (error) {
    console.error("Response error:", error);
    if (error.response) {
      console.error("Error data:", error.response.data);
      console.error("Error status:", error.response.status);
    }
    return Promise.reject(error);
  }
);

export default axios;
