import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class InfoPackageSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;


  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;
  // @IsOptional()
  // @IsString()
  // entryDateFrom?: string;

  // @IsOptional()
  // @IsString()
  // entryDateTo?: string;
}
