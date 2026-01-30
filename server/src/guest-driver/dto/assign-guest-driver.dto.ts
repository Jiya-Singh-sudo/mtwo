import { IsString, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export class AssignGuestDriverDto {
  @IsString()
  guest_id: string;

  @IsString()
  driver_id: string;

  @IsOptional()
  @IsString()
  pickup_location?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  @IsString()
  drop_location?: string;

  @IsString()
  trip_date: string;

  @IsString()
  start_time: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsString()
  trip_status?: string;

  @IsOptional()
  @IsString()
  drop_date?: string;

  @IsOptional()
  @IsString()
  drop_time?: string;
}
