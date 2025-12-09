// src/api/vehicles.api.ts
import api, { safeGet } from "./apiClient";
import type { VehicleCreateDto, VehicleUpdateDto } from "../types/vehicles";

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
  const res = await api.delete(
    `/vehicles/${encodeURIComponent(vehicleNo)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
