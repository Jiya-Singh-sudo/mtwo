import api from './apiClient';
import { logout } from '@/context/authUtils';
import { errorHandler } from '@/utils/errorHandler';

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
    (error) => {
      const isSilent = (error.config as any)?.silent === true;
      if (!isSilent) {
        errorHandler(error);
      }
      if (error.response?.status === 401) {
        logout(); // hard logout
      }
      return Promise.reject(error);
    }
  );
}
