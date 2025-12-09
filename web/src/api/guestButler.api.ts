import api, { safeGet } from "./apiClient";
import type {
  GuestButler,
  GuestButlerCreateDto,
  GuestButlerUpdateDto
} from "../types/guestButler";

// GET active
export async function getActiveGuestButlers() {
  return safeGet<GuestButler[]>("/guest-butler");
}

// GET all (active + inactive)
export async function getAllGuestButlers() {
  return safeGet<GuestButler[]>("/guest-butler/all");
}

// CREATE
export async function createGuestButler(
  data: GuestButlerCreateDto,
  user = "system"
) {
  const res = await api.post("/guest-butler", data, {
    headers: { "x-user": user },
  });
  return res.data;
}

// UPDATE
export async function updateGuestButler(
  id: string,
  data: GuestButlerUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/guest-butler/${encodeURIComponent(id)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// SOFT DELETE
export async function softDeleteGuestButler(id: string, user = "system") {
  const res = await api.delete(
    `/guest-butler/${encodeURIComponent(id)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
