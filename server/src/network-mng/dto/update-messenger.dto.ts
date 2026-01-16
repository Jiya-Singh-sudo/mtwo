import {
  IsString,
  IsOptional,
  IsEmail,
  Matches,
  IsBoolean,
} from 'class-validator';

export class UpdateMessengerDto {
  @IsOptional()
  @IsString()
  messenger_name?: string;

  @IsOptional()
  @IsString()
  messenger_name_local_language?: string;

  @IsOptional()
  @Matches(/^[6-9]\d{9}$/)
  primary_mobile?: string;

  @IsOptional()
  @Matches(/^[6-9]\d{9}$/)
  secondary_mobile?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
