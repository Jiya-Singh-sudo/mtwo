import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginMDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}
  