import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateGuestHousekeepingDto {
  @IsString()
  guest_id: string;

  @IsString()
  hk_id: string;        // Staff ID

  @IsString()
  room_id: string;     // Guest receiving service

  @IsString()
  task_date: string;   // YYYY-MM-DD

  @IsIn(['Morning', 'Evening', 'Night', 'Full-Day'])
  task_shift: 'Morning' | 'Evening' | 'Night' | 'Full-Day';

  @IsString()
  service_type: string;

  @IsOptional()
  @IsString()
  admin_instructions?: string;

  // status handled by DB defaults
}
