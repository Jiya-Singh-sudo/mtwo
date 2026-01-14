import { IsString, IsOptional } from 'class-validator';

export class CreateGuestVehicleDto {
  @IsString()
  guest_id: string;

  @IsString()
  vehicle_no: string;

  @IsOptional()
  @IsString()
  location?: string;
}
