import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNetworkDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  provider_id: number; // NOT SERIAL

  @IsString()
  provider_name: string;

  @IsOptional()
  @IsString()
  provider_name_local_language?: string;

  @IsIn(['WiFi', 'Broadband', 'Hotspot', 'Leased-Line'])
  network_type: 'WiFi' | 'Broadband' | 'Hotspot' | 'Leased-Line';

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
  password?: string; // SHA256 hex (validated elsewhere)

  @IsOptional()
  @IsString()
  static_ip?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
