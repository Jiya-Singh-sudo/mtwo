import { IsString, IsOptional, IsIn, Matches, IsBoolean, MaxLength, MinLength,} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateHousekeepingDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2, { message: 'Housekeeping name is too short' })
  @MaxLength(50, { message: 'Housekeeping name is too long' })
  hk_name?: string;

  // @IsOptional()
  // @IsString()
  // hk_name_local_language?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Contact number must be a valid 10-digit mobile number',
  })
  hk_contact?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Alternate contact must be a valid 10-digit mobile number',
  })
  hk_alternate_contact?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255, { message: 'Address is too long' })
  address?: string;

  @IsOptional()
  @IsIn(['Morning', 'Evening', 'Night', 'Full-Day'], {
    message: 'Invalid shift value',
  })
  shift?: 'Morning' | 'Evening' | 'Night' | 'Full-Day';

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
