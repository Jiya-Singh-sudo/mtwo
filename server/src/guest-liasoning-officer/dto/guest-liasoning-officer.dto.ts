// server/src/modules/guest-liasoning-officer/dto/guest-liasoning-officer.dto.ts

import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateGuestLiasoningOfficerDto {
  @IsString()
  guest_id: string;

  @IsString()
  officer_id: string;

  @IsDateString()
  from_date: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @IsString()
  duty_location?: string;
}

export class UpdateGuestLiasoningOfficerDto {
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @IsString()
  duty_location?: string;
}
