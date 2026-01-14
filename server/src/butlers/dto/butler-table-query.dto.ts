import {
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ButlerTableQueryDto {
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
    'butler_id',
    'butler_name',
    'shift',
    'is_active',
    'inserted_at',
  ])
  sortBy?:
    | 'butler_id'
    | 'butler_name'
    | 'shift'
    | 'is_active'
    | 'inserted_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';
}
