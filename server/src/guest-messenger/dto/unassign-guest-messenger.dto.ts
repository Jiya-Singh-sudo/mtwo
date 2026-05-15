import { IsOptional, IsString } from 'class-validator';

export class UnassignGuestMessengerDto {
  @IsString()
  @IsOptional()
  remarks?: string;
}
