import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class UpdateGuestButlerDto {
  @IsOptional()
  @IsString()
  guest_id?: string;

  @IsOptional()
  @IsString()
  butler_id?: string;

  @IsOptional()
  @IsString()
  room_id?: string;

  @IsOptional()
  @IsString()
  check_in_date?: string;

  @IsOptional()
  @IsString()
  check_in_time?: string;

  @IsOptional()
  @IsString()
  check_out_date?: string;

  @IsOptional()
  @IsString()
  check_out_time?: string;

  @IsOptional()
  @IsIn([
    'Tea',
    'Coffee',
    'Snacks',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Water-Service',
    'Newspaper-Service',
    'Luggage-Assist',
    'Wakeup-Service',
    'Room-Assist',
    'Cleaning-Assist',
    'Personal-Request',
    'Other',
  ])
  service_type?:
    | 'Tea'
    | 'Coffee'
    | 'Snacks'
    | 'Breakfast'
    | 'Lunch'
    | 'Dinner'
    | 'Water-Service'
    | 'Newspaper-Service'
    | 'Luggage-Assist'
    | 'Wakeup-Service'
    | 'Room-Assist'
    | 'Cleaning-Assist'
    | 'Personal-Request'
    | 'Other';

  @IsOptional()
  @IsString()
  service_description?: string;

  @IsOptional()
  @IsString()
  service_date?: string;

  @IsOptional()
  @IsString()
  service_time?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
