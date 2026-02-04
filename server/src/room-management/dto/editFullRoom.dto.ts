import { IsString, IsOptional, IsIn, IsInt, Min, ValidateIf, IsDateString } from 'class-validator';
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

  /**
   * action_type is REQUIRED only when guest_id is NOT null
   */
  @ValidateIf((o) => o.guest_id !== undefined && o.guest_id !== null)
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
  @IsString()
  action_description?: string;

  @IsOptional()
  @IsDateString()
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

  /**
   * task_date required ONLY when hk_id is not null
   */
  @ValidateIf((o) => o.hk_id !== undefined && o.hk_id !== null)
  @IsDateString()
  task_date?: string; // YYYY-MM-DD

  /**
   * task_shift required ONLY when hk_id is not null
   */
  @ValidateIf((o) => o.hk_id !== undefined && o.hk_id !== null)
  @IsIn(['Morning', 'Evening', 'Night', 'Full-Day'])
  task_shift?: 'Morning' | 'Evening' | 'Night' | 'Full-Day';

  /**
   * service_type required ONLY when hk_id is not null
   */
  @ValidateIf((o) => o.hk_id !== undefined && o.hk_id !== null)
  @IsString()
  service_type?: string;

  @IsOptional()
  @IsString()
  admin_instructions?: string;

  // @IsOptional()
  // @IsString()
  // hk_id?: string | null;

  // @IsString()
  // task_date: string; // YYYY-MM-DD

  // @IsIn(['Morning', 'Evening', 'Night', 'Full-Day'])
  // task_shift: 'Morning' | 'Evening' | 'Night' | 'Full-Day';

  // @IsString()
  // service_type: string;

  // @IsOptional()
  // @IsString()
  // admin_instructions?: string;
}
