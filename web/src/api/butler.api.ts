import api, { safeGet } from "./apiClient";
import type { ButlerCreateDto, ButlerUpdateDto } from "../types/butler";

// GET active butlers
export async function getActiveButlers() {
  return safeGet<any[]>("/butlers");
}

// GET all (active + inactive)
export async function getAllButlers() {
  return safeGet<any[]>("/butlers/all");
}

// CREATE
export async function createButler(
  data: ButlerCreateDto,
  user = "system"
) {
  const res = await api.post("/butlers", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// UPDATE (by butler_name)
export async function updateButler(
  butlerId: string,
  data: ButlerUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/butlers/${encodeURIComponent(butlerId)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// SOFT DELETE
export async function softDeleteButler(
  butlerId: string,
  user = "system"
) {
  const res = await api.delete(
    `/butlers/${encodeURIComponent(butlerId)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
