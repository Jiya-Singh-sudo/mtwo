import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateDriverDto {
  @IsString()
  driver_name: string;

  @IsString()
  @IsOptional()
  driver_name_ll?: string;

  @IsString()
  driver_contact: string;

  @IsString()
  @IsOptional()
  driver_alternate_contact?: string;

  @IsString()
  driver_license: string;

  @IsOptional()
  @IsEmail()
  driver_mail: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  @IsDateString()
  license_expiry_date?: string;
}
