import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateGuestDesignationDto {
  @IsOptional()
  @IsString()
  designation_id?: string;

  @IsOptional()
  @IsString()
  designation_name?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  office_location?: string;

  @IsOptional()
  @IsBoolean()
  is_current?: boolean;
}
