import { IsOptional, IsString, IsBoolean, MaxLength, Matches } from 'class-validator';

export class UpdateGuestMessengerDto {
  @IsString()
  @Matches(/^G[0-9]+$/)
  guest_id: string;

  @IsString()
  @Matches(/^M[0-9]+$/)
  messenger_id: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  assignment_date: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
