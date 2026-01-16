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
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  start_date?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  start_time?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  end_date?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  end_time?: string;

  @IsOptional()
  @IsIn(['Waiting', 'Success'])
  start_status?: 'Waiting' | 'Success';

  @IsOptional()
  @IsIn(['Waiting', 'Success'])
  end_status?: 'Waiting' | 'Success';

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
