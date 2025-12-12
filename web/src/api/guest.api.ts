// src/api/guest.api.ts
import api from "./apiClient";
import type { GuestCreateDto, GuestUpdateDto } from "../types/guests";

export async function getActiveGuestsWithInOut() {
  // GET /guests (controller returns active only by default)
  const res = await api.get("/guests/guestsWithInOut");
  return res.data;
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
