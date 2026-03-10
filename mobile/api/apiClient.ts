// api/apiClient.ts

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * REQUEST INTERCEPTOR
 * Automatically attach JWT
 */
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * Handle expired / invalid token
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

/**
 * Optional helper
 */
export async function safeGet<T = any>(url: string, params?: any) {
  const res = await api.get<T>(url, { params });
  return res.data;
}

export default api;