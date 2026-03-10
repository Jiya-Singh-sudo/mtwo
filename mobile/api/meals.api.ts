// src/api/meals.api.ts
import api, { safeGet } from "./apiClient";
import type { MealCreateDto, MealUpdateDto } from "../types/meals";

// GET /meals → active only
export async function getActiveMeals() {
  return safeGet<any[]>("/meals");
}

// GET /meals/all → active + inactive
export async function getAllMeals() {
  return safeGet<any[]>("/meals/all");
}

// POST /meals
export async function createMeal(data: MealCreateDto, user = "system") {
  const res = await api.post("/meals", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// PUT /meals/:food_name
export async function updateMeal(
  foodName: string,
  data: MealUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/meals/${encodeURIComponent(foodName)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// DELETE /meals/:food_name
export async function softDeleteMeal(foodName: string, user = "system") {
  const res = await api.delete(
    `/meals/${encodeURIComponent(foodName)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
