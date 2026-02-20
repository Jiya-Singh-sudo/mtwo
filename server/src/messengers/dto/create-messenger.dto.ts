import { IsString, IsOptional, Matches, MaxLength, IsEmail,} from 'class-validator';

export class CreateMessengerDto {
@IsString()
@MaxLength(50)
@Matches(/^[A-Za-z\s]+$/, { message: 'Name must contain only letters' })
  messenger_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  messenger_name_local_language?: string;

@IsString()
@Matches(/^\d{10}$/, { message: 'Primary mobile must be 10 digits' })
  primary_mobile: string;

  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'Secondary mobile must be 10 digits' })
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
