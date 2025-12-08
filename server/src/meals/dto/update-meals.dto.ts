export class UpdateMealDto {
  food_name?: string;
  food_desc?: string;
  food_type?: 'Veg' | 'Non-Veg' | 'Jain' | 'Vegan' | 'Egg';
  is_active?: boolean;
}
