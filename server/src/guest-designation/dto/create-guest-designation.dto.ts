export class CreateGuestDesignationDto {
  guest_id!: number | string;
  designation_id!: string;         // provided by frontend
  designation_name?: string;       // if provided, create/upsert m_designation
  department?: string;
  organization?: string;
  office_location?: string;
}
