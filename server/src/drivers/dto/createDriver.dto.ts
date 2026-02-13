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
  driver_name_ll: string;

  @IsString()
  driver_contact: string;

  @IsString()
  driver_alternate_contact: string;

  @IsString()
  driver_license: string;

  @IsEmail()
  driver_mail: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsDateString()
  license_expiry_date?: string;
}
