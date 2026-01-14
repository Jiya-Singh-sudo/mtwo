import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateGuestHousekeepingDto {
  @IsOptional()
  @IsString()
  hk_id?: string;

  @IsOptional()
  @IsString()
  room_id?: string;

  @IsOptional()
  @IsString()
  task_date?: string;

  @IsOptional()
  @IsIn(['Morning', 'Evening', 'Night', 'Full-Day'])
  task_shift?: 'Morning' | 'Evening' | 'Night' | 'Full-Day';

  @IsOptional()
  @IsString()
  service_type?: string;

  @IsOptional()
  @IsString()
  admin_instructions?: string;

  @IsOptional()
  @IsIn(['Scheduled', 'In-Progress', 'Completed', 'Cancelled'])
  status?: 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled';

  @IsOptional()
  @IsString()
  completed_at?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
