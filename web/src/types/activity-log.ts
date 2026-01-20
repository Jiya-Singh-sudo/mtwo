export interface ActivityLog {
  activity_id: string;
  message: string;
  module: string;
  action: string;
  reference_id?: string | null;
  performed_by?: string | null;
  inserted_at: string;
  inserted_ip?: string | null;
}

export interface ActivityLogResponse {
  data: ActivityLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
