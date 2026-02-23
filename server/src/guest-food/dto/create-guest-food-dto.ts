import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGuestFoodDto {
  @IsString()
  guest_id: string;

  @IsOptional()
  @IsString()
  butler_id?: string;

  @IsOptional()
  @IsString()
  room_id?: string;
  
  @IsOptional()
  @IsString()
  food_id?: string;

  @IsOptional()
  @IsString()
  food_name?: string;

  @IsOptional()
  @IsIn(['Veg', 'Non-Veg', 'Jain', 'Vegan', 'Egg'])
  food_type?: 'Veg' | 'Non-Veg' | 'Jain' | 'Vegan' | 'Egg';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
  
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
  meal_type: 'Breakfast' | 'Lunch' | 'High Tea' | 'Dinner';

  @IsOptional()
  @IsString()
  plan_date?: string;

  // @IsOptional()
  // @IsIn([
  //   'Room-Service',
  //   'Dine-In',
  //   'Buffet',
  //   'Takeaway',
  //   'Other',
  // ])
  // request_type?:
  //   | 'Room-Service'
  //   | 'Dine-In'
  //   | 'Buffet'
  //   | 'Takeaway'
  //   | 'Other';

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
}
