import { IsOptional, IsString, IsEmail, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  role_id?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  primary_mobile?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  alternate_mobile?: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}