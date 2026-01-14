import { IsOptional, IsString } from 'class-validator';

export class CreateGuestDesignationDto {
  @IsString()
  guest_id!: string;

  @IsString()
  designation_id!: string; // provided by frontend

  @IsOptional()
  @IsString()
  designation_name?: string; // triggers upsert in service

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  office_location?: string;
}
