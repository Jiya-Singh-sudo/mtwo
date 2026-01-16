import { IsOptional, IsString, IsIn } from 'class-validator';
import { BaseTableQueryDto } from '../../../common/dto/table-query.dto';

export class GuestTransportTableQueryDto extends BaseTableQueryDto {
  @IsOptional()
  @IsIn([
    'entry_date',
    'guest_name',
    'driver_name',
    'vehicle_no',
    'trip_status',
  ])
  sortBy?: 
    | 'entry_date'
    | 'guest_name'
    | 'driver_name'
    | 'vehicle_no'
    | 'trip_status';

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  entryDateFrom?: string;

  @IsOptional()
  @IsString()
  entryDateTo?: string;
}
