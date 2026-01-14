import {
  IsString,
  IsOptional,
  IsIn,
  Matches,
  IsBoolean,
} from 'class-validator';

export class UpdateHousekeepingDto {
  @IsOptional()
  @IsString()
  hk_name?: string;

  @IsOptional()
  @IsString()
  hk_name_local_language?: string;

  @IsOptional()
  @Matches(/^[6-9]\d{9}$/)
  hk_contact?: string;

  @IsOptional()
  @Matches(/^[6-9]\d{9}$/)
  hk_alternate_contact?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsIn(['Morning', 'Evening', 'Night', 'Full-Day'])
  shift?: 'Morning' | 'Evening' | 'Night' | 'Full-Day';

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
