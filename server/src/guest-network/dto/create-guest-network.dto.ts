import {
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateGuestNetworkDto {
  @IsString()
  guest_id: string;

  @IsString()
  provider_id: string;

  @IsOptional()
  @IsString()
  room_id?: string;

  @IsOptional()
  @IsString()
  network_zone_from?: string;

  @IsOptional()
  @IsString()
  network_zone_to?: string;

  @IsString()
  start_date: string; // YYYY-MM-DD

  @IsString()
  start_time: string; // HH:mm

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsString()
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
  network_status?:
    | 'Requested'
    | 'Connected'
    | 'Disconnected'
    | 'Issue-Reported'
    | 'Resolved'
    | 'Cancelled';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
