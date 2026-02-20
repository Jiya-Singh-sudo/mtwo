import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateGuestNetworkDto {
  @IsOptional()
  @Matches(/^N[0-9]+$/)
  provider_id?: string;

  @IsOptional()
  @IsString()
  room_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  network_zone_from?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  network_zone_to?: string;

  @IsOptional()
  @IsIn([
    'Requested',
    'Connected',
    'Disconnected',
    'Issue-Reported',
    'Resolved',
    'Cancelled',
  ])
  network_status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
