import { IsOptional, IsString, IsIn, IsNumber, IsBoolean, } from 'class-validator';
export class UpdateButlerDto {
  @IsOptional()
  @IsString()
  butler_name: string;
  @IsOptional()
  @IsString()
  butler_name_local_language?: string;
  @IsOptional()
  @IsNumber()
  butler_mobile: string; // validated by backend regex
  @IsOptional()
  @IsNumber()
  butler_alternate_mobile?: string; // validated by backend regex
  @IsOptional()
  @IsString()
  address?: string;
  @IsOptional()
  @IsString()
  remarks?: string;
  @IsOptional()
  @IsIn(["Morning", "Evening", "Night", "Full-Day"])
  shift?: "Morning" | "Evening" | "Night" | "Full-Day";
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
