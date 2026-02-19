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



export const updateGuestFood = async (
  guestFoodId: string,
  payload: {
    food_id?: string;
    food_stage?: "PLANNED" | "ORDERED" | "DELIVERED" | "CANCELLED";
    delivery_status?: string;
    remarks?: string;
  }
) => {
  const res = await apiClient.put(`/guest-food/${guestFoodId}`, payload);
  return res.data;
};

export const createDayMealPlan = async (meals: Record<string, string[]>) => {
  const res = await apiClient.post("/guest-food/plan/day", { meals });
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

export const getGuestFoodTable = async (params: {
  page: number;
  limit: number;
  search?: string;
  status?: 'All' | 'Entered' | 'Inside' | 'Exited' | 'Cancelled';
  mealType?: 'Breakfast' | 'Lunch' | 'High Tea' | 'Dinner';
  sortBy?: 'entry_date' | 'guest_name' | 'meal_status' | 'delivery_status' | 'butler_name' | 'room_id';
  sortOrder?: 'asc' | 'desc';
  foodStatus?: 'SERVED' | 'NOT_SERVED';
  entryDateFrom?: string;
  entryDateTo?: string;
}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.append(key, String(value));
    }
  });

  const res = await apiClient.get(`/guest-food/table?${query.toString()}`);
  return res.data; // { data, totalCount }
};
