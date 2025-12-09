import api, { safeGet } from "./apiClient";
import type {
  GuestNetwork,
  GuestNetworkCreateDto,
  GuestNetworkUpdateDto
} from "@/types/guestNetwork";

// GET active sessions
export async function getActiveGuestNetwork() {
  return safeGet<GuestNetwork[]>("/guest-network");
}

// GET all sessions
export async function getAllGuestNetwork() {
  return safeGet<GuestNetwork[]>("/guest-network/all");
}

// CREATE
export async function createGuestNetwork(
  data: GuestNetworkCreateDto,
  user = "system"
) {
  const res = await api.post("/guest-network", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// UPDATE
export async function updateGuestNetwork(
  id: string,
  data: GuestNetworkUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/guest-network/${encodeURIComponent(id)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// SOFT DELETE
export async function softDeleteGuestNetwork(id: string, user = "system") {
  const res = await api.delete(
    `/guest-network/${encodeURIComponent(id)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
