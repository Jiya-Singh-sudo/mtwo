import api, { safeGet } from "./apiClient";
import type {
  GuestInOut,
  GuestInOutCreateDto,
  GuestInOutUpdateDto
} from "../types/guestInOut";

// GET active only
export async function getActiveGuestInOut() {
  return safeGet<GuestInOut[]>("/guest-inout");
}

// GET all (active + inactive)
export async function getAllGuestInOut() {
  return safeGet<GuestInOut[]>("/guest-inout/all");
}

// CREATE
export async function createGuestInOut(
  data: GuestInOutCreateDto,
  user = "system"
) {
  const res = await api.post("/guest-inout", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// UPDATE
export async function updateGuestInOut(
  id: string,
  data: GuestInOutUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/guest-inout/${encodeURIComponent(id)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// SOFT DELETE
export async function softDeleteGuestInOut(
  id: string,
  user = "system"
) {
  const res = await api.delete(
    `/guest-inout/${encodeURIComponent(id)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
