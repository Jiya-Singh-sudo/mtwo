import api, { safeGet } from "./apiClient";
import type {
  GuestRoom,
  GuestRoomCreateDto,
  GuestRoomUpdateDto
} from "@/types/guestRoom";

// GET active room movements
export async function getActiveGuestRoom() {
  return safeGet<GuestRoom[]>("/guest-room");
}

// GET all
export async function getAllGuestRoom() {
  return safeGet<GuestRoom[]>("/guest-room/all");
}

// CREATE
export async function createGuestRoom(
  data: GuestRoomCreateDto,
  user = "system"
) {
  const res = await api.post("/guest-room", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// UPDATE
export async function updateGuestRoom(
  id: string,
  data: GuestRoomUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/guest-room/${encodeURIComponent(id)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// SOFT DELETE
export async function softDeleteGuestRoom(id: string, user = "system") {
  const res = await api.delete(
    `/guest-room/${encodeURIComponent(id)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
