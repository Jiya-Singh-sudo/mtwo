import { IsOptional, IsIn } from 'class-validator';
import { BaseTableQueryDto } from '../../../common/dto/table-query.dto';

export class GuestMessengerTableQueryDto extends BaseTableQueryDto {
  @IsOptional()
  @IsIn([
    'assignment_date',
    'guest_name',
    'messenger_name',
  ])
  sortBy?:
    | 'assignment_date'
    | 'guest_name'
    | 'messenger_name';

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
