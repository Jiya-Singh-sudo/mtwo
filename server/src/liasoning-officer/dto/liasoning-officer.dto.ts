// server/src/modules/liasoning-officer/dto/liasoning-officer.dto.ts

import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateLiasoningOfficerDto {
  @IsString()
  officer_id: string;

  @IsString()
  officer_name: string;

  @IsOptional()
  @IsString()
  officer_name_local_language?: string;

  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  alternate_mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  role_id: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateLiasoningOfficerDto {
  @IsOptional()
  @IsString()
  officer_name?: string;

  @IsOptional()
  @IsString()
  officer_name_local_language?: string;

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
  role_id?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
