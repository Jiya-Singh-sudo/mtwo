import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateDesignationDto {
  @IsOptional()
  @IsString()
  designation_name?: string;

  @IsOptional()
  @IsString()
  designation_name_local_language?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
