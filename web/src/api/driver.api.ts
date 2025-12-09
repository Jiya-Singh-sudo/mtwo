// src/api/driver.api.ts
import api, { safeGet } from "./apiClient";
import type { CreateDriverDto, UpdateDriverDto } from "../types/drivers";

// GET /drivers → only active drivers
export async function getActiveDrivers() {
  return safeGet<any[]>("/drivers");
}

// GET /drivers/all → active + inactive
export async function getAllDrivers() {
  return safeGet<any[]>("/drivers/all");
}

// POST /drivers
export async function createDriver(data: CreateDriverDto, user = "system") {
  const res = await api.post("/drivers", data, {
    headers: { "x-user": user },
  });
  return res.data;
}

// PUT /drivers/:driver_name
export async function updateDriver(
  driverName: string,
  data: UpdateDriverDto,
  user = "system"
) {
  const res = await api.put(
    `/drivers/${encodeURIComponent(driverName)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// DELETE /drivers/:driver_name
export async function softDeleteDriver(driverName: string, user = "system") {
  const res = await api.delete(
    `/drivers/${encodeURIComponent(driverName)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
