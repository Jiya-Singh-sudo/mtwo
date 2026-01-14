import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EditRoomFullDto {
  /* =======================
     ROOM FIELDS
  ======================= */

  @IsOptional()
  @IsString()
  room_no?: string;

  @IsOptional()
  @IsString()
  room_name?: string;

  @IsOptional()
  @IsString()
  building_name?: string;

  @IsOptional()
  @IsString()
  residence_type?: string;

  @IsOptional()
  @IsString()
  room_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  room_capacity?: number;

  @IsOptional()
  @IsString()
  room_category?: string;

  @IsOptional()
  @IsIn(['Available', 'Occupied'])
  status?: 'Available' | 'Occupied';

  /* =======================
     GUEST ASSIGNMENT
  ======================= */

  @IsOptional()
  @IsString()
  guest_id?: string | null;

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
  action_date?: string;

  @IsOptional()
  @IsString()
  action_time?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  /* =======================
     HOUSEKEEPING ASSIGNMENT
  ======================= */

  @IsOptional()
  @IsString()
  hk_id?: string | null;

  @IsString()
  task_date: string; // YYYY-MM-DD

  @IsIn(['Morning', 'Evening', 'Night', 'Full-Day'])
  task_shift: 'Morning' | 'Evening' | 'Night' | 'Full-Day';

  @IsString()
  service_type: string;

  @IsOptional()
  @IsString()
  admin_instructions?: string;
}
