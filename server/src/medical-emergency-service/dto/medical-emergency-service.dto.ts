// server/src/modules/medical-emergency-service/dto/medical-emergency-service.dto.ts

import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateMedicalEmergencyServiceDto {
  @IsString()
  service_id: string;

  @IsString()
  service_provider_name: string;

  @IsOptional()
  @IsString()
  service_provider_name_local_language?: string;

  @IsString()
  service_type: string;

  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  alternate_mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address_line?: string;

  @IsOptional()
  @IsString()
  distance_from_guest_house?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateMedicalEmergencyServiceDto {
  @IsOptional()
  @IsString()
  service_provider_name?: string;

  @IsOptional()
  @IsString()
  service_provider_name_local_language?: string;

  @IsOptional()
  @IsString()
  service_type?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  alternate_mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address_line?: string;

  @IsOptional()
  @IsString()
  distance_from_guest_house?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
