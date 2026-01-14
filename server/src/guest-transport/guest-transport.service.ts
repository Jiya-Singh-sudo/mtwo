import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { GuestTransportTableQueryDto } from './dto/guest-transport-table.dto';

@Injectable()
export class GuestTransportService {
    constructor(private readonly db: DatabaseService) {}

    async getGuestTransportTable(
    params: GuestTransportTableQueryDto & {
        entryDateFrom?: string;
        entryDateTo?: string;
    }) {
    const {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        status,
        entryDateFrom,
        entryDateTo,
    } = params;

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
    // const where: string[] = [
    //     'io.is_active = TRUE',
    //     'g.is_active = TRUE',
    //     "io.status IN ('Entered', 'Inside', 'Scheduled')",
    // ];

    // const where: string[] = [
    //     "io.entry_date IS NOT NULL"
    // ];

    const where: string[] = ["1=1"];

    const sqlParams: any[] = [];
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
        sqlParams.push(`%${search}%`);
        idx++;
    }

    /* ---------- STATUS FILTER ---------- */
    if (status) {
      where.push(`io.status = $${idx}`);
      sqlParams.push(status);
      idx++;
    }

    /* ---------- DATE RANGE ---------- */
    if (entryDateFrom) {
      where.push(`io.entry_date >= $${idx}`);
      sqlParams.push(entryDateFrom);
      idx++;
    }

    if (entryDateTo) {
        where.push(`io.entry_date < ($${idx}::date + INTERVAL '1 day')`);
        sqlParams.push(entryDateTo);
        idx++;
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    /* ---------------- COUNT ---------------- */
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM t_guest_inout io
      JOIN m_guest g
        ON g.guest_id = io.guest_id
      LEFT JOIN t_guest_driver gd
        ON gd.guest_id = g.guest_id AND gd.is_active = TRUE
      LEFT JOIN m_driver d
        ON d.driver_id = gd.driver_id
      LEFT JOIN t_guest_vehicle gv
        ON gv.guest_id = g.guest_id AND gv.is_active = TRUE
      LEFT JOIN m_vehicle v
        ON v.vehicle_no = gv.vehicle_no
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

    const countRes = await this.db.query(countSql, sqlParams);

    sqlParams.push(limit, offset);
    const dataRes = await this.db.query(dataSql, sqlParams);
    console.log('WHERE:', where.join(' AND '));
    console.log('PARAMS:', sqlParams);


    return {
        data: dataRes.rows,
        totalCount: countRes.rows[0].total,
    };
    }
}
