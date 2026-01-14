import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  room_no: string;

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
  room_type?: string; // Single / Double / Family

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  room_capacity?: number;

  @IsOptional()
  @IsString()
  room_category?: string; // AC / Non-AC / Deluxe

  @IsIn(['Available', 'Occupied'])
  status: 'Available' | 'Occupied';
}
