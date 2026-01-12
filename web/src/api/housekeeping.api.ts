import api, { safeGet } from "./apiClient";
import type { HousekeepingCreateDto, HousekeepingUpdateDto } from "../types/housekeeping";

export async function getActiveHousekeeping(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const res = await api.get("/housekeeping/all", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 100,
      search: params?.search,
      sortBy: params?.sortBy ?? 'hk_name',
      sortOrder: params?.sortOrder ?? 'asc',
    }
  });
  return res.data;
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

export async function getHkShiftEnum() {
  return safeGet<{ enum_value: string }[]>("/enums/hk_shift_enum");
}
export async function getRoomBoyOptions() {
  const data = await getActiveHousekeeping();
  return data.map((hk: { hk_id: string; hk_name: string }) => ({
    hk_id: hk.hk_id,
    hk_name: hk.hk_name,
  }));
}


