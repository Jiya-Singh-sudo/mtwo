import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateGuestInOutDto {
  @IsString()
  guest_id!: string;

  @IsString()
  entry_date!: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  room_id?: string;

  @IsString()
  entry_time!: string; // HH:MM or HH:MM:SS

  @IsOptional()
  @IsString()
  exit_date?: string;

  @IsOptional()
  @IsString()
  exit_time?: string;

  @IsOptional()
  @IsIn(['Entered', 'Inside', 'Exited', 'Cancelled', 'Scheduled'])
  status?: 'Entered' | 'Inside' | 'Exited' | 'Cancelled' | 'Scheduled';

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}