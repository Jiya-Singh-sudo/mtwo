export class UpdateGuestNetworkDto {
  provider_id?: string;
  room_id?: string;

  network_zone_from?: string;
  network_zone_to?: string;

  start_date?: string;
  start_time?: string;

  end_date?: string;
  end_time?: string;

  start_status?: "Waiting" | "Success";
  end_status?: "Waiting" | "Success";

  network_status?: "Requested" | "Connected" | "Disconnected" | "Issue-Reported" | "Resolved" | "Cancelled";

  description?: string;
  remarks?: string;

  is_active?: boolean;
}
