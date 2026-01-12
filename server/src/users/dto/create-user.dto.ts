import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;   // 🔴 REQUIRED

  @IsString()
  full_name_local_language?: string;

  @IsString()
  role_id: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  mobile?: number;
  alternate_mobile?: number;
  email?: string;
}
