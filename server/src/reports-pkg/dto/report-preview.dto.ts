import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReportCode {
  GUEST_SUMMARY = 'GUEST_SUMMARY',
  ROOM_OCCUPANCY = 'ROOM_OCCUPANCY',
  ROOM_OCCUPANCY_TREND = 'ROOM_OCCUPANCY_TREND',
  VEHICLE_USAGE = 'VEHICLE_USAGE',
  FOOD_ORDERS = 'FOOD_ORDERS',
  NETWORK_USAGE = 'NETWORK_USAGE',
}

export class ReportPreviewDto {
  @IsEnum(ReportCode)
  reportCode: ReportCode;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;
}
