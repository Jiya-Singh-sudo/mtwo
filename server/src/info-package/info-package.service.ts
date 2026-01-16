import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { InfoPackageSearchDto } from './dto/info-package-search.dto';
import { infoPackageTemplate } from './templates/info-package.template';
import { generatePdfFromHtml } from '../../common/utlis/pdf.utils';
import { sendWhatsappDocument } from '../../common/utlis/whatsapp.util';
import { logInfoPackageAudit } from '../../common/utlis/info-package-audit.util';

@Injectable()
export class InfoPackageService {
  constructor(private readonly db: DatabaseService) {}

    async searchGuests(query: InfoPackageSearchDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const offset = (page - 1) * limit;
    const search = `%${query.search || ''}%`;

    const dataSql = `
        SELECT
        g.guest_id,
        g.guest_name,
        g.designation,
        g.department,
        g.vip_type,
        r.room_no,
        r.room_type,
        s.check_in_date AS arrival_date,
        s.check_out_date AS departure_date,
        s.status AS stay_status,
        v.vehicle_no,
        v.vehicle_name,
        d.driver_name
        FROM m_guest g
        JOIN t_guest_stay s
        ON s.guest_id = g.guest_id
        AND s.is_active = 1
        LEFT JOIN m_room r
        ON r.room_id = s.room_id
        LEFT JOIN t_guest_transport gt
        ON gt.guest_id = g.guest_id
        AND gt.is_active = 1
        LEFT JOIN m_vehicle v
        ON v.vehicle_id = gt.vehicle_id
        LEFT JOIN m_driver d
        ON d.driver_id = gt.driver_id
        WHERE
        g.is_active = 1
        AND s.check_out_date >= CURRENT_DATE
        AND (
            g.guest_name ILIKE $1
            OR r.room_no ILIKE $1
            OR v.vehicle_no ILIKE $1
        )
        ORDER BY s.check_in_date DESC
        LIMIT $2 OFFSET $3
    `;

    const countSql = `
        SELECT COUNT(DISTINCT g.guest_id) AS total
        FROM m_guest g
        JOIN t_guest_stay s
        ON s.guest_id = g.guest_id
        AND s.is_active = 1
        LEFT JOIN m_room r
        ON r.room_id = s.room_id
        LEFT JOIN t_guest_transport gt
        ON gt.guest_id = g.guest_id
        AND gt.is_active = 1
        LEFT JOIN m_vehicle v
        ON v.vehicle_id = gt.vehicle_id
        WHERE
        g.is_active = 1
        AND s.check_out_date >= CURRENT_DATE
        AND (
            g.guest_name ILIKE $1
            OR r.room_no ILIKE $1
            OR v.vehicle_no ILIKE $1
        )
    `;

    const data = await this.db.query(dataSql, [search, limit, offset]);
    const countResult = await this.db.query(countSql, [search]);

    return {
        data,
        total: Number(countResult[0]?.total || 0),
        page,
        limit,
    };
    }

    async getGuestInfo(guestId: string) {
    const sql = `
        SELECT
        g.guest_id,
        g.guest_name,
        g.designation,
        g.department,
        g.vip_type,
        g.contact_no,
        s.guest_stay_id,
        s.check_in_date,
        s.check_out_date,
        s.status AS stay_status,
        r.room_no,
        r.room_type,
        v.vehicle_no,
        v.vehicle_name,
        d.driver_name,
        d.driver_contact
        FROM m_guest g
        JOIN t_guest_stay s
        ON s.guest_id = g.guest_id
        AND s.is_active = 1
        LEFT JOIN m_room r
        ON r.room_id = s.room_id
        LEFT JOIN t_guest_transport gt
        ON gt.guest_id = g.guest_id
        AND gt.is_active = 1
        LEFT JOIN m_vehicle v
        ON v.vehicle_id = gt.vehicle_id
        LEFT JOIN m_driver d
        ON d.driver_id = gt.driver_id
        WHERE
        g.guest_id = $1
        AND g.is_active = 1
        ORDER BY s.check_in_date DESC
        LIMIT 1
    `;

    const result = await this.db.query(sql, [guestId]);

    if (!result.length) {
        throw new Error('Guest not found or no active stay');
    }

    const row = result[0];

    return {
        guest: {
        guestId: row.guest_id,
        name: row.guest_name,
        designation: row.designation,
        department: row.department,
        vipType: row.vip_type,
        contactNo: row.contact_no,
        },
        stay: {
        stayId: row.guest_stay_id,
        checkInDate: row.check_in_date,
        checkOutDate: row.check_out_date,
        status: row.stay_status,
        roomNo: row.room_no,
        roomType: row.room_type,
        },
        transport: {
        vehicleNo: row.vehicle_no,
        vehicleName: row.vehicle_name,
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
        const pdfBuffer = await generatePdfFromHtml(html);

        return {
            fileName: `Guest_Info_${guestId}.pdf`,
            buffer: pdfBuffer,
        };
    }

    async sendWhatsapp(
    guestId: string,
    context?: { performedBy: string; ipAddress?: string },
    ) {
    // 1️⃣ Get data
    const data = await this.getGuestInfo(guestId);

    if (!data.guest.contactNo) {
        throw new Error('Guest contact number not available');
    }

    // 2️⃣ Generate PDF (reuse logic)
    const html = infoPackageTemplate(data);
    const pdfBuffer = await generatePdfFromHtml(html);

    const fileName = `Guest_Info_${guestId}.pdf`;

    // 3️⃣ Send WhatsApp
    const response = await sendWhatsappDocument({
        to: data.guest.contactNo,
        caption: 'Guest Information Package',
        fileName,
        fileBuffer: pdfBuffer,
    });

    if (!response.success) {
        throw new Error('WhatsApp sending failed');
    }

    // 4️⃣ Audit log
    await logInfoPackageAudit(this.db, {
        guestId,
        actionType: 'WHATSAPP_SENT',
        performedBy: context?.performedBy || 'system',
        ipAddress: context?.ipAddress,
    });

    return {
        status: 'sent',
        messageId: response.providerMessageId,
    };
    }

}
