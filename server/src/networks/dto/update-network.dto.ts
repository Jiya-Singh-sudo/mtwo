import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  IsBoolean,
  IsNotEmpty,
  IsIP,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNetworkDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  provider_name?: string;

  @IsOptional()
  @IsString()
  provider_name_local_language?: string;

  @IsOptional()
  @IsIn(['WiFi', 'Broadband', 'Hotspot', 'Leased-Line'])
  network_type?: 'WiFi' | 'Broadband' | 'Hotspot' | 'Leased-Line';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bandwidth_mbps?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIP(4)
  static_ip?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
