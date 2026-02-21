import { IsOptional, IsString, IsIn, IsNumber, } from 'class-validator';
export class CreateButlerDto {
  @IsString()
  butler_name: string;
  @IsOptional()
  @IsString()
  butler_name_local_language?: string;

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
  
  @IsIn(["Morning", "Evening", "Night", "Full-Day"])
  shift: "Morning" | "Evening" | "Night" | "Full-Day";
}
