import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { DriverShiftEnum } from '../../../common/enum/driver-shift.enum';

export class CreateDriverDutyDto {
  @IsString()
  driver_id: string;

  @IsDateString()
  duty_date: string; // YYYY-MM-DD

  @IsEnum(DriverShiftEnum)
  shift: DriverShiftEnum;

  @IsOptional()
  @IsString()
  duty_in_time?: string; // HH:mm

  @IsOptional()
  @IsString()
  duty_out_time?: string;

  @IsOptional()
  @IsBoolean()
  is_week_off?: boolean;

  @IsOptional()
  @IsBoolean()
  repeat_weekly?: boolean;
}
