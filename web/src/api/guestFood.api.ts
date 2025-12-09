import api, { safeGet } from "./apiClient";
import type {
  GuestFood,
  GuestFoodCreateDto,
  GuestFoodUpdateDto
} from "@/types/guestFood";

// GET active orders
export async function getActiveGuestFood() {
  return safeGet<GuestFood[]>("/guest-food");
}

// GET all orders
export async function getAllGuestFood() {
  return safeGet<GuestFood[]>("/guest-food/all");
}

// CREATE
export async function createGuestFood(
  data: GuestFoodCreateDto,
  user = "system"
) {
  const res = await api.post("/guest-food", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// UPDATE
export async function updateGuestFood(
  id: string,
  data: GuestFoodUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/guest-food/${encodeURIComponent(id)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// SOFT DELETE
export async function softDeleteGuestFood(
  id: string,
  user = "system"
) {
  const res = await api.delete(
    `/guest-food/${encodeURIComponent(id)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
