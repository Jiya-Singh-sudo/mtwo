// server/src/reports-pkg/engines/officer.engine.ts

import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class OfficerReportEngine {
  constructor(private readonly db: DbClient) {}

  async run(
    reportCode: ReportCode,
    filters: { fromDate: string; toDate: string }
  ) {
    switch (reportCode) {
      case ReportCode.OFFICER_DAILY_SUMMARY:
      case ReportCode.OFFICER_WEEKLY_SUMMARY:
      case ReportCode.OFFICER_MONTHLY_SUMMARY:
        return this.officerSummaryReport(filters);

      default:
        throw new Error(`Unsupported officer report: ${reportCode}`);
    }
  }

  private async officerSummaryReport(filters: {
    fromDate: string;
    toDate: string;
  }) {
    const { fromDate, toDate } = filters;

    const result = await this.db.query(
      `
      SELECT
        ms.staff_id,
        ms.full_name AS officer_name,
        ms.full_name_local_language,
        ms.primary_mobile,
        ms.alternate_mobile,
        ms.email,
        ms.address,
        ms.designation,

        mlo.officer_id,
        mlo.role_id AS officer_role,

        tglo.guest_officer_id,
        tglo.guest_id,
        tglo.assignment_start_date,
        tglo.assignment_end_date,
        tglo.duty_location,
        tglo.remarks,

        mmes.service_id,
        mmes.service_type AS medical_service,

        ms.is_active,

        ms.inserted_at,
        ms.updated_at

      FROM m_staff ms

      LEFT JOIN m_liasoning_officer mlo
        ON mlo.staff_id = ms.staff_id
       AND mlo.is_active = true

      LEFT JOIN t_guest_liasoning_officer tglo
        ON tglo.officer_id = mlo.officer_id
       AND tglo.is_active = true

      LEFT JOIN m_medical_emergency_service mmes
        ON mmes.staff_id = ms.staff_id
       AND mmes.is_active = true

      WHERE ms.is_active = true
        AND DATE(ms.inserted_at) BETWEEN $1 AND $2

      ORDER BY ms.full_name ASC
      `,
      [fromDate, toDate]
    );

    return result?.rows ?? [];
  }
}