import {
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  role_name: string;

  @IsString()
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
