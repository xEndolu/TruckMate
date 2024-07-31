// src/axiosConfig.js

import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL;

export default axios;
