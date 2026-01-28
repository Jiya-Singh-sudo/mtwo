import { IsString, IsOptional, IsISO8601 } from 'class-validator';

export class CreateGuestVehicleDto {
  @IsString()
  guest_id: string;

  @IsString()
  vehicle_no: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsISO8601()
  assigned_at: string;

  @IsOptional()
  @IsISO8601()
  released_at?: string;

}
