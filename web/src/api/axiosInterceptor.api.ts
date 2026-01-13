import api from './apiClient';
import { logout } from '@/context/authUtils';

export function setupAxiosInterceptors() {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout(); // hard logout
      }
      return Promise.reject(error);
    }
  );
}
