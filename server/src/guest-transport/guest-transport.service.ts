import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class GuestTransportService {
    constructor(private readonly db: DatabaseService) {}
    async getGuestTransportTable(query: {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    }) {
    const { page, limit, search, sortBy, sortOrder } = query;

    const offset = (page - 1) * limit;

    /* ---------------- SORT MAP ---------------- */
    const SORT_MAP: Record<string, string> = {
        entry_date: 'io.entry_date',
        guest_name: 'g.guest_name',
        driver_name: 'd.driver_name',
        vehicle_no: 'v.vehicle_no',
        trip_status: 'gd.trip_status',
    };

    const sortColumn =
        SORT_MAP[sortBy ?? 'entry_date'] ?? SORT_MAP.entry_date;

    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    /* ---------------- WHERE ---------------- */
    const where: string[] = [
        'io.is_active = TRUE',
        'g.is_active = TRUE',
        "io.status IN ('Entered', 'Inside')",
    ];

    const params: any[] = [];
    let idx = 1;

    if (search) {
        where.push(`
        (
            g.guest_name ILIKE $${idx}
            OR g.guest_mobile ILIKE $${idx}
            OR d.driver_name ILIKE $${idx}
            OR v.vehicle_no ILIKE $${idx}
        )
        `);
        params.push(`%${search}%`);
        idx++;
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    /* ---------------- COUNT ---------------- */
    const countSql = `
        SELECT COUNT(*)::int AS total
        FROM t_guest_inout io
        JOIN m_guest g
        ON g.guest_id = io.guest_id
        ${whereSql};
    `;

    /* ---------------- DATA ---------------- */
    const dataSql = `
        SELECT
        g.guest_id,
        g.guest_name,
        g.guest_name_local_language,
        g.guest_mobile,

        io.inout_id,
        io.entry_date,
        io.entry_time,
        io.exit_date,
        io.exit_time,
        io.status AS inout_status,
        io.room_id,

        gd.guest_driver_id,
        gd.driver_id,
        d.driver_name,
        d.driver_contact,
        gd.pickup_location,
        gd.drop_location,
        gd.trip_date,
        gd.start_time,
        gd.end_time,
        gd.trip_status,

        gv.guest_vehicle_id,
        v.vehicle_no,
        v.vehicle_name,
        v.model,
        v.color,
        gv.location,
        gv.assigned_at,
        gv.released_at

        FROM t_guest_inout io
        JOIN m_guest g
        ON g.guest_id = io.guest_id

        LEFT JOIN LATERAL (
        SELECT *
        FROM t_guest_driver
        WHERE guest_id = g.guest_id
            AND is_active = TRUE
        ORDER BY trip_date DESC, start_time DESC
        LIMIT 1
        ) gd ON TRUE

        LEFT JOIN m_driver d
        ON d.driver_id = gd.driver_id

        LEFT JOIN LATERAL (
        SELECT *
        FROM t_guest_vehicle
        WHERE guest_id = g.guest_id
            AND is_active = TRUE
        ORDER BY assigned_at DESC
        LIMIT 1
        ) gv ON TRUE

        LEFT JOIN m_vehicle v
        ON v.vehicle_no = gv.vehicle_no

        ${whereSql}
        ORDER BY ${sortColumn} ${order}
        LIMIT $${idx} OFFSET $${idx + 1};
    `;

    const countRes = await this.db.query(countSql, params);

    params.push(limit, offset);
    const dataRes = await this.db.query(dataSql, params);

    return {
        data: dataRes.rows,
        totalCount: countRes.rows[0].total,
    };
    }
}
