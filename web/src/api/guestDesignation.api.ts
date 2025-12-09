import api, { safeGet } from "./apiClient";
import type {
  GuestDesignation,
  GuestDesignationCreateDto,
  GuestDesignationUpdateDto
} from "../types/guestDesignation";

// GET active only
export async function getActiveGuestDesignations() {
  return safeGet<GuestDesignation[]>("/guest-designation");
}

// GET all (active & inactive)
export async function getAllGuestDesignations() {
  return safeGet<GuestDesignation[]>("/guest-designation/all");
}

// CREATE
export async function createGuestDesignation(
  data: GuestDesignationCreateDto,
  user = "system"
) {
  const res = await api.post("/guest-designation", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// UPDATE
export async function updateGuestDesignation(
  id: string,
  data: GuestDesignationUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/guest-designation/${encodeURIComponent(id)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}
