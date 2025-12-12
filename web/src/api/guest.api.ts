// src/api/guest.api.ts
import api, { safeGet } from "./apiClient";
import type { GuestCreateDto, GuestUpdateDto } from "../types/guests";

export async function getActiveGuests() {
  // GET /guests (controller returns active only by default)
  return safeGet<any[]>("/guests");
}

export async function createGuest(data: GuestCreateDto, user = "system") {
  // backend will attach IP+timestamp; we pass user in header as controller expects x-user
  const res = await api.post("/guests", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

export async function updateGuest(guestName: string, data: GuestUpdateDto, user = "system") {
  const res = await api.put(`/guests/${encodeURIComponent(guestName)}`, data, {
    headers: { "x-user": user }
  });
  return res.data;
}

export async function softDeleteGuest(guestName: string, user = "system") {
  const res = await api.delete(`/guests/${encodeURIComponent(guestName)}`, {
    headers: { "x-user": user }
  });
  return res.data;
}
