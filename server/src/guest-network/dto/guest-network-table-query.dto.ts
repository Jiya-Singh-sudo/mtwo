import { IsOptional, IsString, IsIn } from 'class-validator';
import { BaseTableQueryDto } from '../../../common/dto/table-query.dto';

export class GuestNetworkTableQueryDto extends BaseTableQueryDto {
  @IsOptional()
  @IsIn([
    'start_date',
    'guest_name',
    'provider_name',
    'network_status',
  ])
  sortBy?:
    | 'start_date'
    | 'guest_name'
    | 'provider_name'
    | 'network_status';

  @IsOptional()
  @IsIn([
    'Requested',
    'Connected',
    'Disconnected',
    'Issue-Reported',
    'Resolved',
    'Cancelled',
  ])
  network_status?: string;

  @IsOptional()
  @IsString()
  entryDateFrom?: string;

  @IsOptional()
  @IsString()
  entryDateTo?: string;
}
