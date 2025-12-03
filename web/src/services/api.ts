import axios from 'axios';
// Ensure this path matches your folder structure. 
// If types are in src/types, use '../types/Designation'
import type { Designation, DesignationFormData } from '../pages/types/Designation';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const designationAPI = {
  getAll: async (): Promise<Designation[]> => {
    const response = await api.get('/designations');
    return response.data.data;
  },

  getById: async (id: number): Promise<Designation> => {
    // FIXED: Used backticks ` instead of slashes /
    const response = await api.get(`/designations/${id}`);
    return response.data.data;
  },

  create: async (data: DesignationFormData): Promise<any> => {
    const response = await api.post('/designations', data);
    return response.data;
  },

  update: async (id: number, data: DesignationFormData): Promise<any> => {
    // FIXED: Used backticks ` instead of slashes /
    const response = await api.put(`/designations/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<any> => {
    // FIXED: Used backticks ` instead of slashes /
    const response = await api.delete(`/designations/${id}`);
    return response.data;
  },
};

export default api;