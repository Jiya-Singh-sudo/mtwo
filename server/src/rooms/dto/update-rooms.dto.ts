import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  room_no?: string;

  @IsOptional()
  @IsString()
  room_name?: string;

  @IsOptional()
  @IsString()
  building_name?: string;

  @IsOptional()
  @IsString()
  residence_type?: string;

  @IsOptional()
  @IsString()
  room_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  room_capacity?: number;

  @IsOptional()
  @IsString()
  room_category?: string;

  @IsOptional()
  @IsIn(['Available', 'Maintenance', 'Reserved', 'Occupied'])
  status?: 'Available' | 'Maintenance' | 'Reserved' | 'Occupied';

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
