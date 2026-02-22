import { IsString, IsOptional, IsIn, Matches, MinLength, MaxLength,} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateHousekeepingDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2, { message: 'Housekeeping name is too short' })
  @MaxLength(50, { message: 'Housekeeping name is too long' })
  hk_name: string;


  @IsString()
  // @Matches(/^[6-9]\d{10}$/, {
  //   message: 'Contact number must be a valid 10-digit mobile number',
  // })
  hk_contact: string; // 10-digit mobile

  @IsOptional()
  @IsString()
  // @Matches(/^[6-9]\d{9}$/, {
  //   message: 'Alternate contact must be a valid 10-digit mobile number',
  // })
  hk_alternate_contact?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MaxLength(255, { message: 'Address is too long' })
  address?: string;

  @IsIn(['Morning', 'Evening', 'Night', 'Full-Day'], {
    message: 'Invalid shift value',
  })
  shift: 'Morning' | 'Evening' | 'Night' | 'Full-Day';
}
