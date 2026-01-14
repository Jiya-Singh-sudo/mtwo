import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateMealDto {
  @IsString()
  food_name: string;

  @IsOptional()
  @IsString()
  food_desc?: string;

  @IsIn(['Veg', 'Non-Veg', 'Jain', 'Vegan', 'Egg'])
  food_type: 'Veg' | 'Non-Veg' | 'Jain' | 'Vegan' | 'Egg';
}
