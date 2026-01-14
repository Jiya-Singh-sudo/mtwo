import { IsString } from 'class-validator';

export class AssignGuestDriverDto {
  @IsString()
  guest_id: string;

  @IsString()
  driver_id: string;
}
