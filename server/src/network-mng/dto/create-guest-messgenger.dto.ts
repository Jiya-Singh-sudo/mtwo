import {
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateGuestMessengerDto {
  @IsString()
  guest_id: string;

  @IsString()
  messenger_id: string;

  @IsOptional()
  @IsString()
  assignment_date?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  remarks?: string;
}
