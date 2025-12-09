import api, { safeGet } from "./apiClient";
import type { HousekeepingCreateDto, HousekeepingUpdateDto } from "../types/housekeeping";

export async function getActiveHousekeeping() {
  return safeGet<any[]>("/housekeeping");
}

export async function getAllHousekeeping() {
  return safeGet<any[]>("/housekeeping/all");
}

export async function createHousekeeping(
  data: HousekeepingCreateDto,
  user = "system"
) {
  const res = await api.post("/housekeeping", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

export async function updateHousekeeping(
  hkName: string,
  data: HousekeepingUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/housekeeping/${encodeURIComponent(hkName)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

export async function softDeleteHousekeeping(
  hkName: string,
  user = "system"
) {
  const res = await api.delete(
    `/housekeeping/${encodeURIComponent(hkName)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
