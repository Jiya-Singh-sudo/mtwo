export class UpdateNetworkDto {
  provider_name?: string;
  provider_name_local_language?: string;

  network_type?: "WiFi" | "Broadband" | "Hotspot" | "Leased-Line";

  bandwidth_mbps?: number;
  username?: string;
  password?: string;
  static_ip?: string;
  address?: string;

  is_active?: boolean;
}
