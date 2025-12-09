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
  butlerName: string,
  data: ButlerUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/butlers/${encodeURIComponent(butlerName)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// SOFT DELETE
export async function softDeleteButler(
  butlerName: string,
  user = "system"
) {
  const res = await api.delete(
    `/butlers/${encodeURIComponent(butlerName)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
