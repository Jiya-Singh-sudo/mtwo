import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateDriverDutyDto } from './createDriverDuty.dto';
import { DriverShiftEnum } from '../../../common/enum/driver-shift.enum';

export class UpdateDriverDutyDto extends PartialType(CreateDriverDutyDto) {
    @IsOptional()
    @IsDateString()
    duty_date?: string;

    @IsOptional()
    @IsEnum(DriverShiftEnum)
    shift?: DriverShiftEnum;

    @IsOptional()
    @IsString()
    duty_in_time?: string;

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
