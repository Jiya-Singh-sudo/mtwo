import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  MaxLength,
  IsNotEmpty,
  IsIP,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNetworkDto {
  // @Type(() => String)
  // @IsString()
  // provider_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provider_name: string;

  @IsOptional()
  @IsString()
  provider_name_local_language?: string;

  @IsIn(['WiFi', 'Broadband', 'Hotspot', 'Leased-Line'])
  network_type: 'WiFi' | 'Broadband' | 'Hotspot' | 'Leased-Line';

  // @IsOptional()
  // @Type(() => Number)
  // @IsInt()
  // @Min(1)
  // bandwidth_mbps?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string; // SHA256 hex (validated elsewhere)

  // @IsOptional()
  // @IsIP(4)
  // static_ip?: string;

  // @IsOptional()
  // @IsString()
  // address?: string;
}
