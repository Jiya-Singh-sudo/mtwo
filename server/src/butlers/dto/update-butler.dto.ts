export class UpdateButlerDto {
  butler_name?: string;
  butler_name_local_language?: string;

  butler_mobile?: string;
  butler_alternate_mobile?: string;
  address?: string;
  remarks?: string;

  shift?: "Morning" | "Evening" | "Night" | "Full-Day";
  is_active?: boolean;
}
