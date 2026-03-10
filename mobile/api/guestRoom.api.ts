import api, { safeGet } from "./apiClient";
import type {
  GuestRoom,
  GuestRoomCreateDto,
  GuestRoomUpdateDto,
  RoomOverview
} from "@/types/guestRoom";

// GET active room movements
export async function getActiveGuestRoom() {
  return safeGet<GuestRoom[]>("/guest-room");
}
//GET room overview
export async function getRoomOverview(): Promise<RoomOverview[]> {
  const res = await api.get('/guest-room/overview');

  return res.data.map((r: any) => ({
    roomId: r.room_id,
    roomNo: r.room_no,
    roomName: r.room_name,
    residenceType: r.residence_type,
    capacity: r.room_capacity,
    status: r.room_status,

    guestRoomId: r.guest_room_id,
    checkInDate: r.check_in_date,
    checkOutDate: r.check_out_date,

    guest: r.guest_id
      ? { guestId: r.guest_id, guestName: r.guest_name }
      : null,
  }));
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
