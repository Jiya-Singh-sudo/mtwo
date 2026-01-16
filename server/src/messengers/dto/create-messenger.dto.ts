import { IsString, IsOptional, Matches, MaxLength, IsEmail,} from 'class-validator';

export class CreateMessengerDto {
  @IsString()
  @MaxLength(100)
  messenger_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  messenger_name_local_language?: string;

  @IsString()
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
  @MaxLength(50)
  designation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
