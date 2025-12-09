// src/api/apiClient.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

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
