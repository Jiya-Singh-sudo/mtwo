import {
  IsString,
  Matches,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateGuestNetworkDto {
  @IsString()
  @Matches(/^G[0-9]+$/)
  guest_id: string;

  @IsString()
  @Matches(/^N[0-9]+$/)
  provider_id: string;

  @IsString()
  @Matches(/^R[0-9]+$/)
  room_id: string;

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
  @MaxLength(500)
  remarks?: string;
}