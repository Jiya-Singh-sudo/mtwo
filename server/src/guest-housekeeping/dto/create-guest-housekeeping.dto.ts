import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateGuestHousekeepingDto {
  // @IsString()
  // guest_id: string;

  @IsString()
  hk_id: string;        // Staff ID

  // @IsString()
  // guest_id: string;        // Staff ID
  @IsString()
  room_id: string;        // Staff ID

  // @IsString()
  // assignment_date: string;   // YYYY-MM-DD

  @IsString()
  @IsOptional()
  status?:string;

  @IsOptional()
  @IsString()
  remarks?: string;

  // status handled by DB defaults
}
