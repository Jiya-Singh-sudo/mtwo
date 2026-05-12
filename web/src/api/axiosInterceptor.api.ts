import api from './apiClient';
// import { logout } from '@/context/authUtils';
import { errorHandler } from '@/utils/errorHandler';

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (
  error: any,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export function setupAxiosInterceptors() {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Auto-mark GET requests as silent unless specifically requested otherwise
    if (config.method?.toLowerCase() === 'get' && (config as any).silent === undefined) {
      (config as any).silent = true;
    }

    return config;
  });
  
  api.interceptors.response.use(
    (response) => response,

    async (error) => {
      const originalRequest = error.config;

      const isSilent = originalRequest?.silent === true;
      const isRefreshCall =
        originalRequest?.url?.includes("/auth/refresh");

      // Ignore refresh endpoint errors
      if (isRefreshCall) {
        return Promise.reject(error);
      }

      if (
        error.response?.status === 401 &&
        !originalRequest._retry
      ) {

        // Already refreshing → queue request
        if (isRefreshing) {

          return new Promise((resolve, reject) => {

            failedQueue.push({
              resolve,
              reject,
            });

          }).then((token) => {

            originalRequest.headers.Authorization =
              `Bearer ${token}`;

            return api(originalRequest);

          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {

          const refreshResponse = await api.post(
            "/auth/refresh",
            {},
            {
              withCredentials: true,
              silent: true,
            } as any
          );

          const newAccessToken =
            refreshResponse.data.accessToken;

          localStorage.setItem(
            "accessToken",
            newAccessToken
          );

          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization =
            `Bearer ${newAccessToken}`;

          return api(originalRequest);

        } catch (refreshError) {

          processQueue(refreshError, null);

          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");

          window.location.replace("/login");

          return Promise.reject(refreshError);

        } finally {

          isRefreshing = false;
        }
      }

      if (!isSilent) {
        errorHandler(error);
      }

      return Promise.reject(error);
    }
  );
// api.interceptors.response.use(
//   (response) => response,

//   async (error) => {
//     const originalRequest = error.config;
//     const isSilent = originalRequest?.silent === true;
//     const isRefreshCall =
//       originalRequest?.url?.includes("/auth/refresh");

//     // Prevent infinite loop
//     if (originalRequest?._retry) {
//       return Promise.reject(error);
//     }

//     // Access token expired
//     if (
//       error.response?.status === 401 &&
//       !isRefreshCall
//     ) {
//       originalRequest._retry = true;

//       try {

//         // Attempt refresh
//         const refreshResponse = await api.post(
//           "/auth/refresh",
//           {},
//           {
//             withCredentials: true,
//             silent: true,
//           } as any
//         );

//         const newAccessToken =
//           refreshResponse.data.accessToken;

//         // Save new token
//         localStorage.setItem(
//           "accessToken",
//           newAccessToken
//         );

//         // Update failed request
//         originalRequest.headers.Authorization =
//           `Bearer ${newAccessToken}`;

//         // Retry original request
//         return api(originalRequest);

//       } catch (refreshError) {

//         // Refresh failed → logout
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("user");

//         if (window.location.pathname !== "/login") {
//           window.location.replace("/login");
//         }

//         return Promise.reject(refreshError);
//       }
//     }

//     // Never show refresh errors
//     if (isRefreshCall) {
//       console.log("No existing session");
//       return Promise.reject(error);
//     }

//     // Normal API errors
//     if (!isSilent) {
//       errorHandler(error);
//     }

//     return Promise.reject(error);
//   }
// );

  // api.interceptors.response.use(
  //   (response) => response,
  //   (error) => {
  //     const isSilent = (error.config as any)?.silent === true;
  //     const isRefreshCall = error.config?.url?.includes("/auth/refresh");

  //     // ❌ NEVER show error for refresh
  //     if (isRefreshCall) {
  //       console.log("No existing session");
  //       return Promise.reject(error);
  //     }

  //     // ❌ Do not show UI error for silent calls
  //     if (!isSilent) {
  //       errorHandler(error);
  //     }

  //     // ✅ Only logout if NOT refresh
  //     if (error.response?.status === 401 && !isRefreshCall) {
  //       localStorage.removeItem("accessToken");
  //       localStorage.removeItem("user");

  //       // Optional: redirect only if already logged in
  //       if (window.location.pathname !== "/login") {
  //         window.location.replace("/login");
  //       }
  //     }

  //     return Promise.reject(error);
  //   }
  // );

}
