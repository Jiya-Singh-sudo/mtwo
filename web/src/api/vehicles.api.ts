// src/api/vehicles.api.ts
import api, { safeGet } from "./apiClient";
import type { VehicleCreateDto, VehicleUpdateDto } from "../types/vehicles";

export function getVehiclesTable(params: {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status?: 'ACTIVE' | 'INACTIVE';
  }) {
  return api.get('/vehicles/table', { params })
    .then(res => res.data);
}

export async function getVehicleStats() {
  const res = await api.get('/vehicles/stats');
  return res.data as {
    total: number;
    active: number;
    inactive: number;
  };
}
// GET /vehicles
export async function getActiveVehicles() {
  return safeGet<any[]>("/vehicles");
}

// GET /vehicles/all
export async function getAllVehicles() {
  return safeGet<any[]>("/vehicles/all");
}

// POST /vehicles
export async function createVehicle(data: VehicleCreateDto, user = "system") {
  const res = await api.post("/vehicles", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// PUT /vehicles/:vehicle_no
export async function updateVehicle(
  vehicleNo: string,
  data: VehicleUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/vehicles/${encodeURIComponent(vehicleNo)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// DELETE /vehicles/:vehicle_no
export async function softDeleteVehicle(vehicleNo: string, user = "system") {
  try {
    const res = await api.delete(
      `/vehicles/delete/${encodeURIComponent(vehicleNo)}`,
      { headers: { "x-user": user } }
    );
    return res.data;
  } catch (err: any) {
    // 👇 THIS is the key line
    throw new Error(
      err?.response?.data?.message ||
      "Unable to delete vehicle. Please try again."
    );
  }
}
// export async function softDeleteVehicle(vehicleNo: string, user = "system") {
//   const res = await api.delete(
//     `/vehicles/delete/${encodeURIComponent(vehicleNo)}`,
//     { headers: { "x-user": user } }
//   );
//   return res.data;
// }
