import {
  IsString,
  IsOptional,
  IsIn,
  Matches,
} from 'class-validator';

export class CreateHousekeepingDto {
  @IsString()
  hk_name: string;

  @IsOptional()
  @IsString()
  hk_name_local_language?: string;

  @Matches(/^[6-9]\d{9}$/)
  hk_contact: string; // 10-digit mobile

  @IsOptional()
  @Matches(/^[6-9]\d{9}$/)
  hk_alternate_contact?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsIn(['Morning', 'Evening', 'Night', 'Full-Day'])
  shift: 'Morning' | 'Evening' | 'Night' | 'Full-Day';
}
