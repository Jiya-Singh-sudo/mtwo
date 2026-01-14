import { IsInt, IsOptional, IsString, IsIn, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GuestTransportTableQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([
    'entry_date',
    'guest_name',
    'driver_name',
    'vehicle_no',
    'trip_status',
  ])
  sortBy?: 'entry_date' | 'guest_name' | 'driver_name' | 'vehicle_no' | 'trip_status';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

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


// export class GuestTransportTableQueryDto {
//   page: number;
//   limit: number;

//   search?: string;

//   sortBy?: 
//     | 'entry_date'
//     | 'guest_name'
//     | 'driver_name'
//     | 'vehicle_no'
//     | 'trip_status';

//   sortOrder?: 'asc' | 'desc';
// }
