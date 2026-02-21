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
    }
  ) {
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
      entry_date: 'base.entry_date',
      guest_name: 'base.guest_name',
      driver_name: 'base.driver_name',
      vehicle_no: 'base.vehicle_no',
      start_datetime: 'base.start_datetime',
    };

    const sortColumn =
      SORT_MAP[sortBy ?? 'entry_date'] ?? SORT_MAP.entry_date;

    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    /* ---------------- WHERE ---------------- */
    const where: string[] = [
      'io.is_active = TRUE',
      'g.is_active = TRUE',
    ];
    const sqlParams: any[] = [];
    let idx = 1;

    /* ---------------- SEARCH ---------------- */
    if (search) {
      where.push(`
        (
          g.guest_name ILIKE $${idx}
          OR g.guest_mobile ILIKE $${idx}
          OR EXISTS (
            SELECT 1
            FROM t_guest_transport gt2
            LEFT JOIN m_driver d2 ON d2.driver_id = gt2.driver_id
            LEFT JOIN m_vehicle v2 ON v2.vehicle_id = gt2.vehicle_id
            WHERE gt2.guest_id = g.guest_id
              AND gt2.is_active = TRUE
              AND (
                d2.driver_name ILIKE $${idx}
                OR v2.vehicle_no ILIKE $${idx}
              )
          )
        )
      `);
      sqlParams.push(`%${search}%`);
      idx++;
    }

    /* ---------------- ENTRY DATE RANGE ---------------- */
    let fromDate = entryDateFrom;
    let toDate = entryDateTo;

    /* If no date filters provided → apply default window */
    if (!fromDate && !toDate) {
      where.push(`
        io.entry_date BETWEEN
          (CURRENT_DATE - INTERVAL '15 days')
          AND
          (CURRENT_DATE + INTERVAL '15 days')
      `);
    } else {
      if (fromDate) {
        where.push(`io.entry_date >= $${idx}`);
        sqlParams.push(fromDate);
        idx++;
      }

      if (toDate) {
        where.push(`io.entry_date < ($${idx}::date + INTERVAL '1 day')`);
        sqlParams.push(toDate);
        idx++;
      }
    }

    /* ---------------- STATUS FILTER ---------------- */
    if (status && status !== 'All') {
      where.push(`io.status = $${idx}`);
      sqlParams.push(status);
      idx++;
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    /* ---------------- COUNT ---------------- */
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM t_guest_inout io
      JOIN m_guest g
        ON g.guest_id = io.guest_id

      LEFT JOIN t_guest_transport gt
        ON gt.guest_id = g.guest_id
        AND gt.is_active = TRUE

      LEFT JOIN m_driver d
        ON d.driver_id = gt.driver_id

      LEFT JOIN m_vehicle v
        ON v.vehicle_id = gt.vehicle_id

      ${whereSql};
    `;

    /* ---------------- DATA ---------------- */
    const dataSql = `
      WITH base AS (
        SELECT
          g.guest_id,
          g.guest_name,
          g.guest_name_local_language,
          g.guest_mobile,

          md.designation_name,
          md.designation_name_local_language,
          gdsg.department,

          io.inout_id,
          io.entry_date,
          io.entry_time,
          io.exit_date,
          io.exit_time,
          io.status AS inout_status,
          io.room_id,
          io.requires_driver,
          io.companions,

          gt.guest_transport_id,
          gt.driver_id,
          d.driver_name,
          d.driver_contact,
          d.driver_license,
          gt.guest_transport_id,
          gt.pickup_location,
          gt.drop_location,
          gt.start_datetime,
          gt.end_datetime,
          v.vehicle_no,
          v.vehicle_name,
          v.model,
          v.color,
          v.capacity,

        FROM t_guest_inout io

        JOIN m_guest g
          ON g.guest_id = io.guest_id
        AND g.is_active = TRUE

        LEFT JOIN t_guest_designation gdsg
          ON gdsg.guest_id = g.guest_id
        AND gdsg.is_current = TRUE
        AND gdsg.is_active = TRUE

        LEFT JOIN m_guest_designation md
          ON md.designation_id = gdsg.designation_id
        AND md.is_active = TRUE

        LEFT JOIN LATERAL (
          SELECT *
          FROM t_guest_transport gt
          WHERE gt.guest_id = g.guest_id
            AND gt.is_active = TRUE
          ORDER BY gt.start_datetime DESC
          LIMIT 1
        ) gt ON TRUE

        LEFT JOIN m_driver d
          ON d.driver_id = gt.driver_id

        LEFT JOIN m_vehicle v
          ON v.vehicle_no = gt.vehicle_no

        ${whereSql}
      )
      SELECT
        base.*,
        CASE
          WHEN base.driver_id IS NOT NULL
          AND (
            base.start_datetime <
              (base.entry_date::timestamp + base.entry_time::time)
            OR
            COALESCE(base.end_datetime, 'infinity') >
              COALESCE(
                (base.exit_date::timestamp + COALESCE(base.exit_time, TIME '23:59')),
                'infinity'
              )
          )
          THEN TRUE
          ELSE FALSE
        END AS driver_conflict,

        CASE
          WHEN base.vehicle_id IS NOT NULL
          AND (
            base.start_datetime <
              (base.entry_date::timestamp + base.entry_time::time)
            OR
            COALESCE(base.end_datetime, 'infinity') >
              COALESCE(
                (base.exit_date::timestamp + COALESCE(base.exit_time, TIME '23:59')),
                'infinity'
              )
          )
          THEN TRUE
          ELSE FALSE
        END AS vehicle_conflict

      FROM base
      ORDER BY ${sortColumn} ${order}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

//     const dataSql = `
//       WITH base AS (
//   SELECT
//     g.guest_id,
//     g.guest_name,
//     g.guest_name_local_language,
//     g.guest_mobile,
//     g.requires_driver,

//     io.inout_id,
//     io.entry_date,
//     io.entry_time,
//     io.exit_date,
//     io.exit_time,
//     io.status AS inout_status,
//     io.room_id,

//     gd.guest_driver_id,
//     gd.driver_id,
//     d.driver_name,
//     d.driver_contact,
//     gd.pickup_location,
//     gd.drop_location,
//     gd.trip_date,
//     gd.start_time,
//     gd.end_time,
//     gd.drop_date,
//     gd.drop_time,
//     gd.trip_status,

//     gv.guest_vehicle_id,
//     v.vehicle_no,
//     v.vehicle_name,
//     v.model,
//     v.color,
//     gv.location,
//     gv.assigned_at,
//     gv.released_at

//   FROM t_guest_inout io
//   JOIN m_guest g
//     ON g.guest_id = io.guest_id

//   LEFT JOIN LATERAL (
//     SELECT *
//     FROM t_guest_driver
//     WHERE guest_id = g.guest_id
//       AND is_active = TRUE
//     ORDER BY trip_date DESC, start_time DESC
//     LIMIT 1
//   ) gd ON TRUE

//   LEFT JOIN m_driver d
//     ON d.driver_id = gd.driver_id

//   LEFT JOIN LATERAL (
//     SELECT *
//     FROM t_guest_vehicle
//     WHERE guest_id = g.guest_id
//       AND is_active = TRUE
//     ORDER BY assigned_at DESC
//     LIMIT 1
//   ) gv ON TRUE

//   LEFT JOIN m_vehicle v
//     ON v.vehicle_no = gv.vehicle_no

//   ${whereSql}
// )
// SELECT
//   base.*,

//   CASE
//     WHEN base.guest_driver_id IS NOT NULL
//     AND (
//       (base.trip_date::timestamp + COALESCE(base.start_time, TIME '00:00'))
//         < (base.entry_date::timestamp + base.entry_time::time)
//       OR
//       COALESCE(
//         (base.drop_date::timestamp + COALESCE(base.drop_time, TIME '23:59')),
//         'infinity'
//       ) >
//       COALESCE(
//         (base.exit_date::timestamp + COALESCE(base.exit_time, TIME '23:59')),
//         'infinity'
//       )
//     )
//     THEN TRUE
//     ELSE FALSE
//   END AS driver_conflict,


//   CASE
//     WHEN base.guest_vehicle_id IS NOT NULL
//      AND (
//        base.assigned_at <
//          (base.entry_date::timestamp + base.entry_time::time)
//        OR
//        COALESCE(base.released_at, 'infinity') >
//          (base.exit_date::timestamp + COALESCE(base.exit_time, TIME '23:59'))
//      )
//     THEN TRUE
//     ELSE FALSE
//   END AS vehicle_conflict

// FROM base
// ORDER BY ${sortColumn} ${order}
// LIMIT $${idx} OFFSET $${idx + 1}
//     `;
    return this.db.transaction(async (client) => {
      try {
      const countRes = await client.query(countSql, sqlParams);

      // sqlParams.push(limit, offset);
      // const dataRes = await this.db.query(dataSql, sqlParams);
      const dataRes = await client.query(
        dataSql,
        [...sqlParams, limit, offset]
      );

      return {
        data: dataRes.rows,
        totalCount: countRes.rows[0].total,
      };
      } catch (err) {
        throw err;
      }
    });
  }
  async findTransportConflictsForGuest(
    guestId: string,
    newStart: Date,
    newEnd: Date,
    client?: any
  ) {
    const res = await client.query(
      `
      SELECT
        guest_transport_id,
        driver_id,
        vehicle_id,
        start_datetime,
        COALESCE(end_datetime, 'infinity') AS end_datetime
      FROM t_guest_transport
      WHERE guest_id = $1
        AND is_active = TRUE
        AND (start_datetime, COALESCE(end_datetime, 'infinity'))
        OVERLAPS ($2, $3)
      `,
      [guestId, newStart, newEnd]
    );

    return res.rows;
  }

}
