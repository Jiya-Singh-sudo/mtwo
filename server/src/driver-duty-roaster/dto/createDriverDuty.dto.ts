// src/driver-duty-roaster/dto/create-driver-duty-roaster.dto.ts
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { DriverShiftEnum } from '../../../common/enum/driver-shift.enum';

export class CreateDriverDutyDto {
  @IsString()
  driver_id: string;

  /* ---------- SUNDAY ---------- */
  @IsOptional()
  @IsString()
  sunday_duty_in_time?: string;

  @IsOptional()
  @IsString()
  sunday_duty_out_time?: string;

  @IsOptional()
  @IsBoolean()
  sunday_week_off?: boolean;

  @IsOptional()
  @IsEnum(DriverShiftEnum)
  sunday_shift?: DriverShiftEnum;

  /* ---------- MONDAY ---------- */
  @IsOptional()
  @IsString()
  monday_duty_in_time?: string;

  @IsOptional()
  @IsString()
  monday_duty_out_time?: string;

  @IsOptional()
  @IsBoolean()
  monday_week_off?: boolean;

  @IsOptional()
  @IsEnum(DriverShiftEnum)
  monday_shift?: DriverShiftEnum;

  /* ---------- TUESDAY ---------- */
  @IsOptional()
  @IsString()
  tuesday_duty_in_time?: string;

  @IsOptional()
  @IsString()
  tuesday_duty_out_time?: string;

  @IsOptional()
  @IsBoolean()
  tuesday_week_off?: boolean;

  @IsOptional()
  @IsEnum(DriverShiftEnum)
  tuesday_shift?: DriverShiftEnum;

  /* ---------- WEDNESDAY ---------- */
  @IsOptional()
  @IsString()
  wednesday_duty_in_time?: string;

  @IsOptional()
  @IsString()
  wednesday_duty_out_time?: string;

  @IsOptional()
  @IsBoolean()
  wednesday_week_off?: boolean;

  @IsOptional()
  @IsEnum(DriverShiftEnum)
  wednesday_shift?: DriverShiftEnum;

  /* ---------- THURSDAY ---------- */
  @IsOptional()
  @IsString()
  thursday_duty_in_time?: string;

  @IsOptional()
  @IsString()
  thursday_duty_out_time?: string;

  @IsOptional()
  @IsBoolean()
  thursday_week_off?: boolean;

  @IsOptional()
  @IsEnum(DriverShiftEnum)
  thursday_shift?: DriverShiftEnum;

  /* ---------- FRIDAY ---------- */
  @IsOptional()
  @IsString()
  friday_duty_in_time?: string;

  @IsOptional()
  @IsString()
  friday_duty_out_time?: string;

  @IsOptional()
  @IsBoolean()
  friday_week_off?: boolean;

  @IsOptional()
  @IsEnum(DriverShiftEnum)
  friday_shift?: DriverShiftEnum;

  /* ---------- SATURDAY ---------- */
  @IsOptional()
  @IsString()
  saturday_duty_in_time?: string;

  @IsOptional()
  @IsString()
  saturday_duty_out_time?: string;

  @IsOptional()
  @IsBoolean()
  saturday_week_off?: boolean;

  @IsOptional()
  @IsEnum(DriverShiftEnum)
  saturday_shift?: DriverShiftEnum;
}
