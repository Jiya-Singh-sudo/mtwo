import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { InfoPackageSearchDto } from './dto/info-package-search.dto';
import { infoPackageTemplate } from './templates/info-package.template';
import { generatePdfBuffer } from '../../common/utlis/pdf/pdf.utils';
import { sendWhatsappDocument } from '../../common/utlis/whatsapp.util';
import { logInfoPackageAudit } from '../../common/utlis/info-package-audit.util';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { formatDateTime } from '../../common/utlis/date-utlis';


@Injectable()
export class InfoPackageService {
  constructor(private readonly db: DatabaseService) { }

  async searchGuests(query: InfoPackageSearchDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const offset = (page - 1) * limit;
    const search = `%${query.search || ''}%`;

    const dataSql = `
    SELECT DISTINCT ON (g.guest_id)
      g.guest_id,
      g.guest_name,
      md.designation_name,
      r.room_no,
      ti.entry_date AS arrival_date,
      ti.exit_date  AS departure_date,
      gv.vehicle_no,
      d.driver_name

    FROM m_guest g
    JOIN t_guest_inout ti
      ON ti.guest_id = g.guest_id
      AND ti.is_active IS TRUE

    LEFT JOIN t_guest_designation gd
      ON gd.guest_id = g.guest_id
      AND gd.is_active IS TRUE
      AND gd.is_current IS TRUE

    LEFT JOIN m_guest_designation md
      ON md.designation_id = gd.designation_id

    LEFT JOIN t_guest_room gr
      ON gr.guest_id = g.guest_id
      AND gr.is_active IS TRUE

    LEFT JOIN m_rooms r
      ON r.room_id = gr.room_id

    LEFT JOIN t_guest_driver gv
      ON gv.guest_id = g.guest_id
      AND gv.is_active IS TRUE

    LEFT JOIN m_driver d
      ON d.driver_id = gv.driver_id

    WHERE
      g.is_active IS TRUE
      AND (ti.exit_date IS NULL OR ti.exit_date >= CURRENT_DATE)
      AND (
        g.guest_name ILIKE $1
        OR r.room_no ILIKE $1
        OR gv.vehicle_no ILIKE $1
      )

    ORDER BY g.guest_id, ti.entry_date DESC
    LIMIT $2 OFFSET $3;
    `;

    const countSql = `
    SELECT COUNT(DISTINCT g.guest_id) AS total
    FROM m_guest g

    JOIN t_guest_inout ti
      ON ti.guest_id = g.guest_id
      AND ti.is_active IS TRUE

    LEFT JOIN t_guest_designation gd
      ON gd.guest_id = g.guest_id
      AND gd.is_active IS TRUE
      AND gd.is_current IS TRUE

    LEFT JOIN m_guest_designation md
      ON md.designation_id = gd.designation_id

    LEFT JOIN t_guest_room gr
      ON gr.guest_id = g.guest_id
      AND gr.is_active IS TRUE

    LEFT JOIN m_rooms r
      ON r.room_id = gr.room_id

    LEFT JOIN t_guest_driver gv
      ON gv.guest_id = g.guest_id
      AND gv.is_active IS TRUE

    WHERE
      g.is_active IS TRUE
      AND (ti.exit_date IS NULL OR ti.exit_date >= CURRENT_DATE)
      AND (
        g.guest_name ILIKE $1
        OR r.room_no ILIKE $1
        OR gv.vehicle_no ILIKE $1
      );
    `;

    const dataResult = await this.db.query(dataSql, [search, limit, offset]);
    const countResult = await this.db.query(countSql, [search]);

    return {
      data: dataResult.rows,   // ✅ THIS IS THE KEY
      total: Number(countResult.rows[0]?.total || 0),
      page,
      limit,
    };

  }

  async getGuestInfo(guestId: string) {
    const sql = `
        SELECT
          g.guest_id,
          g.guest_name,
          g.guest_mobile,
          g.email,

          md.designation_name,
          gd.department,
          gd.organization,
          gd.office_location,

          ti.entry_date,
          ti.exit_date,
          ti.status AS inout_status,

          r.room_no,
          r.room_type,

          gv.vehicle_no,
          d.driver_name,
          d.driver_contact

        FROM m_guest g

        -- active in/out (stay)
        JOIN t_guest_inout ti
          ON ti.guest_id = g.guest_id
          AND ti.is_active IS TRUE

        -- current designation
        LEFT JOIN t_guest_designation gd
          ON gd.guest_id = g.guest_id
          AND gd.is_active IS TRUE
          AND gd.is_current IS TRUE

        LEFT JOIN m_guest_designation md
          ON md.designation_id = gd.designation_id

        -- room
        LEFT JOIN t_guest_room gr
          ON gr.guest_id = g.guest_id
          AND gr.is_active IS TRUE

        LEFT JOIN m_rooms r
          ON r.room_id = gr.room_id

        -- vehicle + driver
        LEFT JOIN t_guest_driver gv
          ON gv.guest_id = g.guest_id
          AND gv.is_active IS TRUE

        LEFT JOIN m_driver d
          ON d.driver_id = gv.driver_id

        WHERE
          g.guest_id = $1
          AND g.is_active IS TRUE

        ORDER BY ti.entry_date DESC
        LIMIT 1;
      `;

    const result = await this.db.query(sql, [guestId]);

    if (!result.rows || result.rows.length === 0) {
      throw new NotFoundException('Guest not found or inactive');
    }

    const row = result.rows[0];
    console.log('DB RESULT KEYS:', Object.keys(result));


    return {
      guest: {
        guestId: row.guest_id,
        name: row.guest_name,
        designation: row.designation_name,
        department: row.department,
        organization: row.organization,
        officeLocation: row.office_location,
        mobile: row.guest_mobile,
        email: row.email,
      },

      stay: {
        arrivalDate: formatDateTime(row.entry_date),
        departureDate: formatDateTime(row.exit_date),
        status: row.inout_status || '-',
        roomNo: row.room_no || '-',
        roomType: row.room_type || '-',
      },


      transport: {
        vehicleNo: row.vehicle_no,
        driverName: row.driver_name,
        driverContact: row.driver_contact,
      },

      meta: {
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async generatePdf(guestId: string) {
    const data = await this.getGuestInfo(guestId);

    const html = infoPackageTemplate(data);
    const pdfBuffer = await generatePdfBuffer(html);
    await this.db.transaction(async (client) => {
      await logInfoPackageAudit(client, {
        guestId,
        actionType: 'PDF_GENERATED',
        performedBy: 'system',
      });
    });

    return {
      fileName: `Guest_Info_${guestId.replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`,
      buffer: pdfBuffer,
    };
  }
  async sendWhatsapp(
    guestId: string,
    context?: { performedBy: string; ipAddress?: string },
  ) {
    const data = await this.getGuestInfo(guestId);

    if (!data.guest.mobile) {
      throw new BadRequestException('Guest mobile number not available');
    }

    const html = infoPackageTemplate(data);
    const pdfBuffer = await generatePdfBuffer(html);
    const fileName = `Guest_Info_${guestId}.pdf`;

    // 🚀 External call OUTSIDE transaction
    const response = await sendWhatsappDocument({
      to: data.guest.mobile,
      caption: 'Guest Information Package',
      fileName,
      fileBuffer: pdfBuffer,
    });

    if (!response?.success) {
      throw new BadRequestException('WhatsApp sending failed');
    }

    // ✅ Only log after successful send
    await this.db.transaction(async (client) => {
      await logInfoPackageAudit(client, {
        guestId,
        actionType: 'WHATSAPP_SENT',
        performedBy: context?.performedBy || 'system',
        ipAddress: context?.ipAddress,
      });
    });

    return {
      status: 'sent',
      messageId: response.providerMessageId,
    };
  }

  // async sendWhatsapp(
  //   guestId: string,
  //   context?: { performedBy: string; ipAddress?: string },
  // ) {
  //   // 1️⃣ Get aggregated guest info
  //   const data = await this.getGuestInfo(guestId);

  //   // 2️⃣ Validate mobile number
  //   if (!data.guest.mobile) {
  //     throw new BadRequestException('Guest mobile number not available');
  //   }

  //   // 3️⃣ Generate PDF
  //   const html = infoPackageTemplate(data);
  //   const pdfBuffer = await generatePdfBuffer(html);

  //   const fileName = `Guest_Info_${guestId}.pdf`;

  //   // 4️⃣ Send WhatsApp document
  //   const response = await sendWhatsappDocument({
  //     to: data.guest.mobile,
  //     caption: 'Guest Information Package',
  //     fileName,
  //     fileBuffer: pdfBuffer,
  //   });

  //   if (!response?.success) {
  //     throw new BadRequestException('WhatsApp sending failed');
  //   }

  //   // 5️⃣ Audit log
  //   await logInfoPackageAudit(this.db, {
  //     guestId,
  //     actionType: 'WHATSAPP_SENT',
  //     performedBy: context?.performedBy || 'system',
  //     ipAddress: context?.ipAddress,
  //   });

  //   return {
  //     status: 'sent',
  //     messageId: response.providerMessageId,
  //   };
  // }
}
