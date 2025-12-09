export class CreateGuestDesignationDto {
  guest_id: string;
  designation_id: string;

  department?: string;
  organization?: string;
  office_location?: string;
}
