import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateMealDto {
  @IsOptional()
  @IsString()
  food_name?: string;

  @IsOptional()
  @IsString()
  food_desc?: string;

  @IsOptional()
  @IsIn(['Veg', 'Non-Veg', 'Jain', 'Vegan', 'Egg'])
  food_type?: 'Veg' | 'Non-Veg' | 'Jain' | 'Vegan' | 'Egg';

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
