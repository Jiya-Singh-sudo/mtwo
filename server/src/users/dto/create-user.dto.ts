import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsOptional()
  @IsString()
  full_name_local_language?: string;

  @IsString()
  @IsNotEmpty()
  role_id: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
@Type(() => Number)
@IsNumber()
  user_mobile?: number;

  @IsOptional()
@Type(() => Number)
@IsNumber()
  user_alternate_mobile?: number;

  @IsOptional()
  @IsEmail()
  email?: string;
}
