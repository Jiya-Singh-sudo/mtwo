// guest-food-table.dto.ts
import { BaseTableQueryDto } from '../../../common/dto/table-query.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class GuestFoodTableQueryDto extends BaseTableQueryDto {
  @IsOptional()
  @IsIn(['All', 'Entered', 'Inside', 'Exited', 'Cancelled'])
  status?: 'All' | 'Entered' | 'Inside' | 'Exited' | 'Cancelled';

  @IsOptional()
  @IsIn(['Breakfast', 'Lunch', 'High Tea', 'Dinner'])
  mealType?: 'Breakfast' | 'Lunch' | 'High Tea' | 'Dinner';

  @IsOptional()
  @IsIn([
    'entry_date',
    'guest_name',
    'meal_status',
    'delivery_status',
    'butler_name',
    'room_id'
  ])
  sortBy?: 'entry_date' | 'guest_name' | 'meal_status' | 'delivery_status' | 'butler_name' | 'room_id';

  @IsOptional()
  @IsIn(['SERVED', 'NOT_SERVED'])
  foodStatus?: 'SERVED' | 'NOT_SERVED'

  @IsOptional()
  @IsString()
  entryDateFrom?: string;

  @IsOptional()
  @IsString()
  entryDateTo?: string;
}
