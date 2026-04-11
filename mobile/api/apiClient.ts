// api/apiClient.ts

import axios from "axios";
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

const getSecureToken = async () => {
  try {
    return await SecureStore.getItemAsync("accessToken");
  } catch {
    return null;
  }
};

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
    const token = await getSecureToken();

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
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("user");
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