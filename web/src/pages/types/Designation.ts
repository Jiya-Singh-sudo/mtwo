export interface Designation {
  id: number;
  designation_name: string;
  department: string;
  description: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface DesignationFormData {
  designation_name: string;
  department: string;
  description: string;
  status: 'active' | 'inactive';
}