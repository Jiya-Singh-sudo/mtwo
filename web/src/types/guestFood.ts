
type FoodType = "Veg" | "Non-Veg" | "Jain" | "Vegan" | "Egg";
export interface GuestFood {
  guest_food_id: string;

  guest_id: string;
  room_id?: string | null;

  food_id: string;
  quantity: number;
  meal_type: "Breakfast" | "Lunch" | "High Tea" | "Dinner";
  plan_date: string;
  food_stage: "PLANNED" | "ORDERED" | "DELIVERED" | "CANCELLED";


  delivery_status: "Requested" | "Preparing" | "Ready" | "Delivered" | "Cancelled";

  order_datetime: string;
  delivered_datetime?: string | null;

  remarks?: string | null;

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface GuestFoodCreateDto {
  guest_id: string;
  room_id?: string;

  food_id: string;
  quantity?: number;
  meal_type: "Breakfast" | "Lunch" | "High Tea" | "Dinner";
  plan_date: string;
  food_stage: "PLANNED" | "ORDERED" | "DELIVERED" | "CANCELLED";

  delivery_status?: "Requested" | "Preparing" | "Ready" | "Delivered" | "Cancelled";

  order_datetime?: string;
  delivered_datetime?: string;

  remarks?: string;
}

export interface GuestFoodUpdateDto {
  meal_type: "Breakfast" | "Lunch" | "High Tea" | "Dinner";
  plan_date: string;
  food_stage?: "PLANNED" | "ORDERED" | "DELIVERED" | "CANCELLED";
  remarks?: string;
}

export interface FoodDashboard {
  totalGuests: number;
  mealsServed: number;
  specialRequests: number;
  menuItems: number;
}

export interface MealScheduleRow {
  food_type: FoodType;
  expected_guests: number;
  menu: string[];
  status: string;
  guest_food_id: string;
}

export interface MealSchedule {
  meal: string;
  window: string;
  data: MealScheduleRow[];
}

export type GuestMealUI = {
  guestFoodId: string;

  // backend identifiers (NOT shown in UI)
  guestId: string;
  roomId: string;

  // UI fields
  guestName: string;
  roomNumber: string;
  meal: "Breakfast" | "Lunch" | "Dinner";
  foodItems: string[];
  foodType: string;
  status: string;

  butler?: {
    id: string;
    name: string;
    guestButlerId?: string;
  };
};

/**
 * UI-only type for guest food planning.
 * Wraps backend guest data for the new guest-centric UI.
 * This does NOT replace backend types.
 */
export type GuestFoodPlan = {
  guestId: string;
  guestName: string;
  roomNumber: string;
  roomId: string;

  plannedMenu: string[];        // INTERNAL ONLY - not sent to backend
  foodType?: "Veg" | "Non-Veg" | "Jain" | "Vegan" | "Egg";

  butler?: {
    id: string;
    name: string;
    guestButlerId?: string;
  };
};

