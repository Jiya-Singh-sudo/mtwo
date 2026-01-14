import {
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateGuestDriverDto {
  @IsString()
  guest_id: string;

  @IsString()
  driver_id: string;

  @IsOptional()
  @IsString()
  vehicle_no?: string;

  @IsOptional()
  @IsString()
  room_id?: string;

  @IsOptional()
  @IsString()
  from_location?: string;

  @IsOptional()
  @IsString()
  to_location?: string;

  @IsString()
  pickup_location: string;

  @IsOptional()
  @IsString()
  drop_location?: string;

  @IsString()
  trip_date: string; // YYYY-MM-DD

  @IsString()
  start_time: string; // HH:mm

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsString()
  drop_date?: string;

  @IsOptional()
  @IsString()
  drop_time?: string;

  @IsOptional()
  @IsIn(['Waiting', 'Success'])
  pickup_status?: 'Waiting' | 'Success';

  @IsOptional()
  @IsIn(['Waiting', 'Success'])
  drop_status?: 'Waiting' | 'Success';

  @IsOptional()
  @IsIn(['Scheduled', 'Ongoing', 'Completed', 'Cancelled'])
  trip_status?: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';

  @IsOptional()
  @IsString()
  remarks?: string;
}
