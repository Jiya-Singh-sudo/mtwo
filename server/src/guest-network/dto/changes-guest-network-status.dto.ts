import {
  IsString,
  IsOptional,
  IsIn,
  Matches,
  MaxLength,
} from 'class-validator';

export class ChangeGuestNetworkStatusDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  start_date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start_time: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  end_date?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  end_time?: string;

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
  @IsIn(['Waiting', 'Success'])
  start_status?: 'Waiting' | 'Success';
}