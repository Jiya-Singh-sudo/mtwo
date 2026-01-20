import {
  IsString,
  IsInt,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  role_name: string;

  @IsString()
  @IsNotEmpty()
  role_desc: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  is_active: number;

  @IsString()
  inserted_by: string;

  @IsString()
  inserted_ip: string;
}
