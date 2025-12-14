import api, { safeGet } from "./apiClient";
import type {
  GuestFood,
  GuestFoodCreateDto,
  GuestFoodUpdateDto
} from "@/types/guestFood";
import axios from "axios";

// GET active orders
export async function getActiveGuestFood() {
  return safeGet<GuestFood[]>("/guest-food");
}

// Dashboard cards
export const getFoodDashboard = async () => {
  const res = await axios.get("/guest-food/dashboard");
  return res.data;
};

// Today meal schedule
export const getTodayMealSchedule = async () => {
  const res = await axios.get("/guest-food/schedule/today");
  return res.data.data;
};

/* =======================
   WRITE APIs
   ======================= */

// Update food order status
export const updateFoodStatus = async (
  guestFoodId: string,
  payload: {
    delivery_status?: string;
    delivered_datetime?: string;
    remarks?: string;
  }
) => {
  const res = await axios.put(`/guest-food/${guestFoodId}`, payload);
  return res.data;
};

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
