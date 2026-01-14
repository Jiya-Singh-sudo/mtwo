import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export enum GuestInoutStatus {
  Entered = 'Entered',
  Inside = 'Inside',
  Exited = 'Exited',
  Cancelled = 'Cancelled',
  Scheduled = 'Scheduled',
}

export class UpdateGuestInoutDto {
  @IsOptional()
  @IsDateString()
  entry_date?: string;

  @IsOptional()
  @IsString()
  entry_time?: string;

  @IsOptional()
  @IsDateString()
  exit_date?: string;

  @IsOptional()
  @IsString()
  exit_time?: string;

  @IsOptional()
  @IsEnum(GuestInoutStatus)
  status?: GuestInoutStatus;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  room_id?: string;
}
