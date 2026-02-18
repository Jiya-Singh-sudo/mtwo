import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
} from 'class-validator';

export class CreateGuestDto {
  @IsString()
  guest_name!: string;

  @IsOptional()
  @IsString()
  guest_name_local_language?: string;

  @IsString()
  guest_mobile!: string;

  @IsOptional()
  @IsString()
  guest_alternate_mobile?: string;

  @IsOptional()
  @IsString()
  guest_address?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // @IsOptional()
  // @IsString()
  // Remarks?: string;

  // id_proof_type?: string;

  // @IsOptional()
  // @IsString()
  // id_proof_number?: string;

  // @IsOptional()
  // @IsBoolean()
  // requires_driver?: boolean;

}
