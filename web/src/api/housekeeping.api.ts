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
) {
  const res = await api.post("/housekeeping", data);
  return res.data;
}

export async function updateHousekeeping(
  hkId: string,
  data: HousekeepingUpdateDto,
) {
  const res = await api.put(
    `/housekeeping/${encodeURIComponent(hkId)}`,
    data,
  );
  return res.data;
}

export async function softDeleteHousekeeping(
  hkId: string,
) {
  const res = await api.delete(
    `/housekeeping/${encodeURIComponent(hkId)}`,
  );
  return res.data;
}

export async function getHkShiftEnum() {
  return safeGet<{ enum_value: string }[]>("/enums/hk_shift_enum");
}
export async function getRoomBoyOptions() {
  const res = await getActiveHousekeeping({
    page: 1,
    limit: 1000, // dropdown needs all
  });

  return res.data.map((hk:any) => ({
    hk_id: hk.hk_id,
    hk_name: hk.hk_name,
  }));
}