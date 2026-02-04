import { IsOptional, IsIn } from 'class-validator';
import { BaseTableQueryDto } from '../../../common/dto/table-query.dto';

export class MessengerTableQueryDto extends BaseTableQueryDto {
  @IsOptional()
  @IsIn([
    'messenger_name',
    'primary_mobile',
    'designation',
    'inserted_at',
  ])
  sortBy?:
    | 'messenger_name'
    | 'primary_mobile'
    | 'designation'
    | 'inserted_at';

  @IsOptional()
  @IsIn(['active', 'inactive', 'assigned', 'unassigned'])
  status?: 'active' | 'inactive' | 'assigned' | 'unassigned';
}
