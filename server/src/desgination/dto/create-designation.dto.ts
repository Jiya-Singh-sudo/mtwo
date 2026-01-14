import { IsString, IsOptional } from 'class-validator';

export class CreateDesignationDto {
  @IsString()
  designation_name: string;

  @IsOptional()
  @IsString()
  designation_name_local_language?: string;
}
