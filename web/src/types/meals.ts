export interface Meal {
  food_id: number;
  food_name: string;
  food_desc?: string | null;
  food_type: "Veg" | "Non-Veg" | "Jain" | "Vegan" | "Egg";

  is_active: boolean;
  inserted_at: string;
  inserted_by: string | null;
  inserted_ip: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface MealCreateDto {
  food_name: string;
  food_desc?: string;
  food_type: "Veg" | "Non-Veg" | "Jain" | "Vegan" | "Egg";
}

export interface MealUpdateDto {
  food_name?: string;
  food_desc?: string;
  food_type?: "Veg" | "Non-Veg" | "Jain" | "Vegan" | "Egg";
  is_active?: boolean;
}
