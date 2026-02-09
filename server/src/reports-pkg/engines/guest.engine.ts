// server/src/reports-pkg/engines/guest.engine.ts

import { DbClient } from '../interfaces/db-client.interface';
import { ReportCode } from '../registry/report.registry';

export class GuestReportEngine {
  constructor(private readonly db: DbClient) {}

  async run(
    reportCode: ReportCode,
    filters: { fromDate: string; toDate: string }
  ) {
    switch (reportCode) {
      case ReportCode.GUEST_DAILY_SUMMARY:
      case ReportCode.GUEST_WEEKLY_SUMMARY:
      case ReportCode.GUEST_MONTHLY_SUMMARY:
        return this.guestSummary(filters);

      default:
        throw new Error(`Unsupported guest report: ${reportCode}`);
    }
  }

  /**
   * Guest Summary data for any date range
   */
  private async guestSummary(filters: {
    fromDate: string;
    toDate: string;
  }) {
    const { fromDate, toDate } = filters;

    const result = await this.db.query(
      `
      SELECT
        g.guest_id,
        g.guest_name,

        gd.designation_name                     AS designation,

        r.room_no,

        hk.hk_name                              AS housekeeper,

        fi.food_name                            AS food_remarks,

        v.vehicle_no,
        d.driver_name,

        gi.purpose                              AS visit_purpose,

        ms.messenger_name                       AS messenger,

        wp.provider_name        AS wifi_provider,
        wp.network_type         AS network_type,
        wp.bandwidth_mbps       AS bandwidth_mbps,


        gi.entry_date,
        gi.exit_date

      FROM m_guest g

      /* ================= DESIGNATION ================= */
      LEFT JOIN t_guest_designation tgd
        ON tgd.guest_id = g.guest_id
      AND tgd.is_current = true
      AND tgd.is_active = true

      LEFT JOIN m_guest_designation gd
        ON gd.designation_id = tgd.designation_id

      /* ================= ROOM ================= */
      LEFT JOIN t_guest_room gr
        ON gr.guest_id = g.guest_id
      AND gr.is_active = true

      LEFT JOIN m_rooms r
        ON r.room_id = gr.room_id

      /* ================= HOUSEKEEPING ================= */
      LEFT JOIN t_guest_hk ghk
        ON ghk.guest_id = g.guest_id
      AND ghk.is_active = true

      LEFT JOIN m_housekeeping hk
        ON hk.hk_id = ghk.hk_id

      /* ================= FOOD ================= */
      LEFT JOIN t_guest_food gf
        ON gf.guest_id = g.guest_id
      AND gf.is_active = true

      LEFT JOIN m_food_items fi
        ON fi.food_id = gf.food_id

      /* ================= VEHICLE ================= */
      LEFT JOIN t_guest_vehicle gv
        ON gv.guest_id = g.guest_id
      AND gv.is_active = true

      LEFT JOIN m_vehicle v
        ON v.vehicle_no = gv.vehicle_no

      /* ================= DRIVER ================= */
      LEFT JOIN t_guest_driver gdv
        ON gdv.guest_id = g.guest_id
      AND gdv.is_active = true

      LEFT JOIN m_driver d
        ON d.driver_id = gdv.driver_id

      /* ================= IN-OUT (PURPOSE) ================= */
      LEFT JOIN t_guest_inout gi
        ON gi.guest_id = g.guest_id
      AND gi.is_active = true

      /* ================= MESSENGER ================= */
      LEFT JOIN t_guest_messenger gm
        ON gm.guest_id = g.guest_id
      AND gm.is_active = true

      LEFT JOIN m_messenger ms
        ON ms.messenger_id = gm.messenger_id

      /* ================= NETWORK ================= */
      LEFT JOIN t_guest_network gn
        ON gn.guest_id = g.guest_id
      AND gn.is_active = true

      LEFT JOIN m_wifi_provider wp
        ON wp.provider_id = gn.provider_id


      WHERE g.is_active = true
        AND gi.entry_date <= $2
        AND (
          gi.exit_date IS NULL
          OR gi.exit_date >= $1
        )


      ORDER BY g.guest_name;
      `,
      [fromDate, toDate]
    );

    return result?.rows ?? [];
  }


}
