import { IsOptional, IsString, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UserTableQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';

    @IsOptional()
    @IsIn([
        'username',
        'full_name',
        'email',
        'role_id',
        'is_active',
    ])
    sortBy?:
        | 'username'
        | 'full_name'
        | 'email'
        | 'role_id'
        | 'is_active';

    @IsOptional()
    @IsString()
    status?: string;
}
