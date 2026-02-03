import {
  IsString,
  IsOptional,
  IsIn,
  Matches,
  MaxLength,
} from 'class-validator';

export class CloseGuestNetworkDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  end_date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end_time: string;

  @IsString()
  @IsIn([
    'Requested',
    'Connected',
    'Disconnected',
    'Issue-Reported',
    'Resolved',
    'Cancelled',
  ])
  end_status: string;

  @IsString()
  @IsIn([
    'Requested',
    'Connected',
    'Disconnected',
    'Issue-Reported',
    'Resolved',
    'Cancelled',
  ])
  network_status: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
