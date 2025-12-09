export class CreateButlerDto {
  butler_name: string;
  butler_name_local_language?: string;

  butler_mobile: string; // validated by backend regex
  butler_alternate_mobile?: string; // validated by backend regex
  address?: string;
  remarks?: string;

  shift: "Morning" | "Evening" | "Night" | "Full-Day";
}
