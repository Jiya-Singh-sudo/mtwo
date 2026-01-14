import {
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @IsString()
  vehicle_no: string;

  @IsString()
  vehicle_name: string;

  @IsString()
  model: string;

  @IsString()
  manufacturing: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  color: string;
}
