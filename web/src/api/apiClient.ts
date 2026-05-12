// src/api/apiClient.ts
import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials: true, // Not needed since we're using localStorage for tokens
});

/**
 * REQUEST INTERCEPTOR
 * Automatically attach JWT
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
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
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) return Promise.reject(error);

    const isRefreshCall = originalRequest.url?.includes("/auth/refresh");

    // ✅ DO NOT HANDLE refresh errors here
    if (isRefreshCall) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const res = await api.post("/auth/refresh", { refreshToken });
        const newAccessToken = res.data.accessToken;
        const newRefreshToken = res.data.refreshToken;

        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);

        // ❌ DO NOT redirect here
        // ❌ DO NOT logout here
        // Let UI layer decide

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // ✅ safety check
//     if (!originalRequest) return Promise.reject(error);

//     const isRefreshCall =
//       originalRequest.url?.includes("/auth/refresh");

//     // ❌ NEVER intercept refresh itself
//     if (isRefreshCall) {
//       return Promise.reject(error);
//     }

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         }).then((token) => {
//           originalRequest.headers.Authorization = `Bearer ${token}`;
//           return api(originalRequest);
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         // const res = await api.post("/auth/refresh", {
//         //   refreshToken,
//         // });// ✅ use api
//         const res = await api.post("/auth/refresh");
//         const newToken = res.data.accessToken;

//         localStorage.setItem("accessToken", newToken);

//         processQueue(null, newToken);

//         originalRequest.headers.Authorization = `Bearer ${newToken}`;
//         return api(originalRequest);
//       } catch (err) {
//         processQueue(err, null);

//         // ✅ prevent loop
//         isRefreshing = false;

//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("user");
//         console.log("401 intercepted:", originalRequest.url);

//         window.location.replace("/login"); // ✅ replace instead of href

//         return Promise.reject(err);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("accessToken");
//       localStorage.removeItem("user");
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   }
// );

// Optional helper stays exactly as-is
export async function safeGet<T = any>(url: string, params?: any) {
  const res = await api.get<T>(url, { params });
  return res.data;
}

export default api;
