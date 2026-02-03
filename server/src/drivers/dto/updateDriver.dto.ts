import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  driver_name?: string;

  @IsOptional()
  @IsString()
  driver_name_ll?: string;

  @IsOptional()
  @IsString()
  driver_contact?: string;

  @IsOptional()
  @IsString()
  driver_alternate_contact?: string;

  @IsOptional()
  @IsString()
  driver_license?: string;

  @IsOptional()
  @IsEmail()
  driver_mail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1')
      return true;
    if (value === false || value === 'false' || value === 0 || value === '0')
      return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
@IsDateString()
license_expiry_date?: string;
}
