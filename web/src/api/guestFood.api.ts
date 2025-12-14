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

export const updateFoodStatus = async (
  guestFoodId: string,
  payload: {
    delivery_status?: string;
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
