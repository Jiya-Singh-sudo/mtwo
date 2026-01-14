import { IsString, IsOptional } from 'class-validator';

export class UpdateGuestVehicleDto {
  @IsOptional()
  @IsString()
  guest_id?: string;

  @IsOptional()
  @IsString()
  driver_id?: string;

  @IsOptional()
  @IsString()
  vehicle_no?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  assigned_at?: string;

  @IsOptional()
  @IsString()
  released_at?: string;
}
