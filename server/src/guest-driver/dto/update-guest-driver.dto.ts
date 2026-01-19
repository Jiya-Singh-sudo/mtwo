import { IsString, IsOptional, IsIn, IsBoolean,} from 'class-validator';

export class UpdateGuestDriverDto {
  @IsOptional()
  @IsString()
  driver_id?: string;

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

  @IsOptional()
  @IsString()
  pickup_location?: string;

  @IsOptional()
  @IsString()
  drop_location?: string;

  @IsOptional()
  @IsString()
  trip_date?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsString()
  drop_date?: string;

  @IsOptional()
  @IsString()
  drop_time?: string;

  // @IsOptional()
  // @IsIn(['Waiting', 'Success'])
  // pickup_status?: 'Waiting' | 'Success';

  // @IsOptional()
  // @IsIn(['Waiting', 'Success'])
  // drop_status?: 'Waiting' | 'Success';

  // @IsOptional()
  // @IsIn(['Scheduled', 'Ongoing', 'Completed', 'Cancelled'])
  // trip_status?: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
