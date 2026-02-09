import apiClient from "./apiClient";

/* =======================
   READ APIs
   ======================= */

export const getFoodDashboard = async () => {
  const res = await apiClient.get("/guest-food/dashboard");
  return res.data;
};

export const getTodayMealSchedule = async () => {
  const res = await apiClient.get("/guest-food/schedule/today");
  return res.data;
};

/* =======================
   WRITE APIs
   ======================= */
export const createGuestFood = async (
  payload: {
    guest_id: string;
    room_id?: string;
    food_id: string;
    quantity: number;
    meal_type: "Breakfast" | "Lunch" | "High Tea" | "Dinner";
    plan_date: string;
    food_stage?: "PLANNED" | "ORDERED" | "DELIVERED" | "CANCELLED";
  }
) => {
  const res = await apiClient.post("/guest-food", payload);
  return res.data;
};

export const updateFoodStatus = async (
  guestFoodId: string,
  payload: {
    food_stage?: "PLANNED" | "ORDERED" | "DELIVERED" | "CANCELLED";
    delivery_status?: "Requested" | "Preparing" | "Ready" | "Delivered" | "Cancelled";
    delivered_datetime?: string;
    remarks?: string;
  }
) => {
  const res = await apiClient.put(
    `/guest-food/${guestFoodId}`,
    payload
  );
  return res.data;
};
export const getTodayGuestOrders = async () => {
  const res = await apiClient.get("/guest-food/guests/today");
  return res.data;
};
export const getTodayMealPlanOverview = async () => {
  const res = await apiClient.get("/guest-food/plan/today");
  return res.data;
};
