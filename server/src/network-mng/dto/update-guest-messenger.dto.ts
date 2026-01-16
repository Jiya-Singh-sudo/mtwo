import {
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateGuestMessengerDto {
  @IsOptional()
  @IsString()
  messenger_id?: string;

  @IsOptional()
  @IsString()
  assignment_date?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
