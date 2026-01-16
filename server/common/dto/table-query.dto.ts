import {
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BaseTableQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
