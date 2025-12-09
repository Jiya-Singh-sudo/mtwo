export interface WifiProvider {
  provider_id: number;

  provider_name: string;
  provider_name_local_language?: string | null;

  network_type: "WiFi" | "Broadband" | "Hotspot" | "Leased-Line";

  bandwidth_mbps?: number | null;
  username?: string | null;
  password?: string | null;  // stored as SHA-256 hex in backend

  static_ip?: string | null;
  address?: string | null;

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface WifiProviderCreateDto {
  provider_name: string;
  provider_name_local_language?: string;

  network_type: "WiFi" | "Broadband" | "Hotspot" | "Leased-Line";

  bandwidth_mbps?: number;

  username?: string;
  password: string; // plaintext — backend will hash

  static_ip?: string;
  address?: string;
}

export interface WifiProviderUpdateDto {
  provider_name?: string;
  provider_name_local_language?: string;

  network_type?: "WiFi" | "Broadband" | "Hotspot" | "Leased-Line";

  bandwidth_mbps?: number;

  username?: string;
  password?: string; // plaintext → backend hashes

  static_ip?: string;
  address?: string;

  is_active?: boolean;
}
