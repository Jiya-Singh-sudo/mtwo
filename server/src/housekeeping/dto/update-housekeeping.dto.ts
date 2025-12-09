export class UpdateHousekeepingDto {
  hk_name?: string;
  hk_name_local_language?: string;

  hk_contact?: string;
  hk_alternate_contact?: string;

  address?: string;
  shift?: "Morning" | "Evening" | "Night" | "Full-Day";

  is_active?: boolean;
}
