// src/api/driver.api.ts
import api from "./apiClient";
// import type { CreateDriverDto, UpdateDriverDto } from "../types/drivers";

/* READ: Driver dashboard (read model, NOT m_driver) */
export async function fetchDrivers() {
  const res = await api.get("/drivers/dashboard");
  return res.data;
}

export function getDriversTable(params: {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status?: 'ACTIVE' | 'INACTIVE';
}) {
  return api.get('/drivers/table', { params })
    .then(res => res.data);
}
export async function getDriverStats() {
  const res = await api.get('/drivers/stats');
  return res.data as {
    total: number;
    active: number;
    inactive: number;
  };
}
/* WRITE: Add new driver */
export async function createDriver(payload: {
  driver_name: string;
  driver_name_ll?: string;
  driver_contact: string;
  driver_alternate_contact?: string;
  driver_license?: string;
  address?: string;
}) {
  const res = await api.post("/drivers", payload);
  return res.data;
}

/* WRITE: Edit driver details */
export async function updateDriver(
  driver_id: string,
  payload: {
    driver_name: string;
    driver_name_ll?: string;
    driver_contact: string;
    driver_alternate_contact?: string;
    driver_license?: string;
    address?: string;
    is_active?: boolean;
  }
) {
  const res = await api.patch(`/drivers/${driver_id}`, payload);
  return res.data;
}

/* READ: Guests with vehicle but no driver */
export async function getAssignableGuestVehicles() {
  const res = await api.get("/guest-vehicle/without-driver");
  return res.data;
}

/* WRITE: Assign driver */
export async function assignDriverToGuestVehicle(payload: {
  guest_vehicle_id: string;
  driver_id: string;
}) {
  const res = await api.post("/drivers/assign", payload);
  return res.data;
}

export async function softDeleteDriver(driver_id: string) {
  try {
    const res = await api.delete(`/drivers/${driver_id}`);
    return res.data;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.message ||
      'Unable to delete driver. Please try again.'
    );
  }
}

// export async function softDeleteDriver(driver_id: string) {
//   const res = await api.delete(`/drivers/${driver_id}`);
//   return res.data;
// } 