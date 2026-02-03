import { IsOptional, IsString, IsIn } from 'class-validator';
import { BaseTableQueryDto } from '../../../common/dto/table-query.dto';

export class NetworkTableQueryDto extends BaseTableQueryDto {
  @IsOptional()
  @IsIn([
    'provider_name',
    'network_type',
    'bandwidth_mbps',
    'inserted_at',
  ])
  sortBy?:
    | 'provider_name'
    | 'network_type'
    | 'bandwidth_mbps'
    | 'inserted_at';

  @IsOptional()
  @IsIn(['all', 'active', 'inactive'])
  status?: 'all' | 'active' | 'inactive';
}
