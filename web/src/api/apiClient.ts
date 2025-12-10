// src/api/apiClient.ts
import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const baseURL = API_BASE_URL;

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // set true if backend expects cookies
});

// Optional: simple response wrapper
export async function safeGet<T = any>(url: string) {
  const res = await api.get<T>(url);
  return res.data;
}

export default api;
