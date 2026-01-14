import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateGuestDto {
  @IsOptional()
  @IsString()
  guest_name?: string;

  @IsOptional()
  @IsString()
  guest_name_local_language?: string;

  @IsOptional()
  @IsString()
  guest_mobile?: string;

  @IsOptional()
  @IsString()
  guest_alternate_mobile?: string;

  @IsOptional()
  @IsString()
  guest_address?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
