import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGuestFoodDto {
  @IsOptional()
  @IsString()
  room_id?: string;

  @IsOptional()
  @IsString()
  food_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
  
  @IsOptional()
  @IsIn([
    'PLANNED',
    'ORDERED',
    'DELIVERED',
    'CANCELLED',
  ])
  food_stage?: 'PLANNED' | 'ORDERED' | 'DELIVERED' | 'CANCELLED';

  @IsOptional()
  @IsIn([
    'Breakfast',
    'Lunch',
    'High Tea',
    'Dinner',
  ])
  meal_type?: 'Breakfast' | 'Lunch' | 'High Tea' | 'Dinner';
  @IsOptional()
  @IsString()
  plan_date?: string;

  @IsOptional()
  @IsIn([
    'Requested',
    'Preparing',
    'Ready',
    'Delivered',
    'Cancelled',
  ])
  delivery_status?:
    | 'Requested'
    | 'Preparing'
    | 'Ready'
    | 'Delivered'
    | 'Cancelled';

  @IsOptional()
  @IsString()
  order_datetime?: string;

  @IsOptional()
  @IsString()
  delivered_datetime?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
