// src/api/rooms.api.ts
import api, { safeGet } from "./apiClient";
import type { RoomCreateDto, RoomUpdateDto } from "../types/rooms";

// GET /rooms → active only
export async function getActiveRooms() {
  return safeGet<any[]>("/rooms");
}

// GET /rooms/all
export async function getAllRooms() {
  return safeGet<any[]>("/rooms/all");
}

// POST /rooms
export async function createRoom(data: RoomCreateDto, user = "system") {
  const res = await api.post("/rooms", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// PUT /rooms/:room_no
export async function updateRoom(
  roomNo: string,
  data: RoomUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/rooms/${encodeURIComponent(roomNo)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// DELETE /rooms/:room_no
export async function softDeleteRoom(roomNo: string, user = "system") {
  const res = await api.delete(
    `/rooms/${encodeURIComponent(roomNo)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
