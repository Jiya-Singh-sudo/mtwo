// server/src/modules/guest-medical-contact/dto/guest-medical-contact.dto.ts

import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateGuestMedicalContactDto {
  @IsString()
  guest_id: string;

  @IsString()
  service_id: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateGuestMedicalContactDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsString()
  guest_id: string;

  @IsString()
  service_id: string;
}
