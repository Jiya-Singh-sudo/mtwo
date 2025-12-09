// src/api/guestDriver.api.ts
import api, { safeGet } from "./apiClient";
import type {
  GuestDriverCreateDto,
  GuestDriverUpdateDto,
  GuestDriver
} from "../types/guestDriver";

// GET active guest-driver entries
export async function getActiveGuestDrivers() {
  return safeGet<GuestDriver[]>("/guest-driver");
}

// GET all (active + inactive)
export async function getAllGuestDrivers() {
  return safeGet<GuestDriver[]>("/guest-driver/all");
}

// CREATE
export async function createGuestDriver(
  data: GuestDriverCreateDto,
  user = "system"
) {
  const res = await api.post("/guest-driver", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// UPDATE (by guest_driver_id)
export async function updateGuestDriver(
  id: string,
  data: GuestDriverUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/guest-driver/${encodeURIComponent(id)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// SOFT DELETE (by guest_driver_id)
export async function softDeleteGuestDriver(id: string, user = "system") {
  const res = await api.delete(
    `/guest-driver/${encodeURIComponent(id)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
