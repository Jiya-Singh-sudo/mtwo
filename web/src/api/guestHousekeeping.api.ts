import api, { safeGet } from "./apiClient";
import type {
  GuestHousekeeping,
  GuestHousekeepingCreateDto,
  GuestHousekeepingUpdateDto
} from "../types/guestHousekeeping";

// GET active tasks
export async function getActiveGuestHousekeeping() {
  return safeGet<GuestHousekeeping[]>("/guest-housekeeping");
}

// GET all tasks
export async function getAllGuestHousekeeping() {
  return safeGet<GuestHousekeeping[]>("/guest-housekeeping/all");
}

// CREATE
export async function createGuestHousekeeping(
  data: GuestHousekeepingCreateDto,
  user = "system"
) {
  const res = await api.post("/guest-housekeeping", data, {
    headers: { "x-user": user },
  });
  return res.data;
}

// UPDATE
export async function updateGuestHousekeeping(
  id: string,
  data: GuestHousekeepingUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/guest-housekeeping/${encodeURIComponent(id)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// CANCEL (status = "Cancelled")
export async function cancelGuestHousekeeping(id: string, user = "system") {
  const res = await api.put(
    `/guest-housekeeping/${encodeURIComponent(id)}/cancel`,
    {},
    { headers: { "x-user": user } }
  );
  return res.data;
}
