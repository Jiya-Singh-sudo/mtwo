import {
  IsString,
  IsOptional,
  IsEmail,
  Matches,
} from 'class-validator';

export class CreateMessengerDto {
  @IsString()
  messenger_name: string;

  @IsOptional()
  @IsString()
  messenger_name_local_language?: string;

  @Matches(/^[6-9]\d{9}$/)
  primary_mobile: string;

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
}
