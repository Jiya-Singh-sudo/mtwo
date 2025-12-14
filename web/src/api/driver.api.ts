// src/api/driver.api.ts
import api from "./apiClient";
// import type { CreateDriverDto, UpdateDriverDto } from "../types/drivers";

/* READ: Driver dashboard (read model, NOT m_driver) */
export async function getDriverDashboard() {
  const res = await api.get("/drivers/dashboard");
  return res.data;
}

/* WRITE: Add new driver */
export async function createDriver(payload: {
  driver_name: string;
  driver_contact: string;
  driver_license?: string;
}) {
  const res = await api.post("/drivers", payload);
  return res.data;
}

/* WRITE: Edit driver details */
export async function updateDriver(
  driver_id: string,
  payload: {
    driver_name: string;
    driver_contact: string;
    driver_license?: string;
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