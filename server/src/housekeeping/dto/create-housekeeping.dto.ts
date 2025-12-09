export class CreateHousekeepingDto {
  hk_name: string;
  hk_name_local_language?: string;

  hk_contact: string; // must be 10 digits
  hk_alternate_contact?: string;

  address?: string;
  shift: "Morning" | "Evening" | "Night" | "Full-Day";
}
