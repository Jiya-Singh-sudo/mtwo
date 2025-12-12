import api, { safeGet } from "./apiClient";
import type {
  GuestInOut,
  GuestInOutCreateDto,
  GuestInOutUpdateDto
} from "../types/guestInOut";
import axios from "axios";

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
export async function softDeleteGuestInout(inout_Id: string) {
  // const res = await fetch(`/api/guest-inout/${inout_Id}/soft-delete`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // if (!res.ok) {
  //   const text = await res.text();
  //   throw new Error(`Failed to soft-delete: ${res.status} ${text}`);
  // }

  const res = await api.post(`/guest-inout/${encodeURIComponent(inout_Id)}/soft-delete`);
  return res.data;

  
}
