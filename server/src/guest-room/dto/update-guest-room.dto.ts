import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateGuestRoomDto {
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
    'Room-Allocated',
    'Room-Changed',
    'Room-Upgraded',
    'Room-Downgraded',
    'Extra-Bed-Added',
    'Room-Shifted',
    'Room-Released',
    'Other',
  ])
  action_type?:
    | 'Room-Allocated'
    | 'Room-Changed'
    | 'Room-Upgraded'
    | 'Room-Downgraded'
    | 'Extra-Bed-Added'
    | 'Room-Shifted'
    | 'Room-Released'
    | 'Other';

  @IsOptional()
  @IsIn(['Available', 'Occupied'])
  status?: 'Available' | 'Occupied';

  @IsOptional()
  @IsString()
  action_description?: string;

  @IsOptional()
  @IsString()
  action_date?: string;

  @IsOptional()
  @IsString()
  action_time?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
