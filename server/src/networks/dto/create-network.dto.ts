export class CreateNetworkDto {
  provider_id: number;  // NOT SERIAL
  provider_name: string;
  provider_name_local_language?: string;

  network_type: "WiFi" | "Broadband" | "Hotspot" | "Leased-Line";

  bandwidth_mbps?: number;
  username?: string;
  password?: string;   // SHA256 hex
  static_ip?: string;
  address?: string;
}
