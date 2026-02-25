import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateGuestRoomDto {
  @IsString()
  guest_id: string;

  @IsString()
  room_id: string;

  @IsOptional()
  @IsString()
  check_in_date?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  check_in_time?: string; // HH:mm

  @IsOptional()
  @IsString()
  check_out_date?: string;

  @IsOptional()
  @IsString()
  check_out_time?: string;

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
  action_type:
    | 'Room-Allocated'
    | 'Room-Changed'
    | 'Room-Upgraded'
    | 'Room-Downgraded'
    | 'Extra-Bed-Added'
    | 'Room-Shifted'
    | 'Room-Released'
    | 'Other';

  @IsOptional()
  @IsString()
  action_description?: string;

  @IsOptional()
  @IsString()
  action_date?: string; // DB default

  @IsOptional()
  @IsString()
  action_time?: string; // DB default

  @IsOptional()
  @IsString()
  remarks?: string;
}
