import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateGuestHousekeepingDto {
  @IsOptional()
  @IsString()
  hk_id?: string;
  @IsString()
  room_id: string;        // Staff ID

  // @IsOptional()
  // @IsString()
  // guest_id?: string;

  // @IsOptional()
  // @IsString()
  // assignment_date?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
