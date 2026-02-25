import { BadRequestException, Injectable } from '@nestjs/common';
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
    if (!Number.isInteger(page) || page <= 0) {
      throw new BadRequestException('INVALID_PAGE');
    }

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new BadRequestException('INVALID_LIMIT');
    }

    if (limit > 100) {
      throw new BadRequestException('LIMIT_TOO_LARGE');
    }
    const offset = (page - 1) * limit;
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      throw new BadRequestException('INVALID_SORT_ORDER');
    }
    /* ---------------- SORT MAP ---------------- */
    const SORT_MAP: Record<string, string> = {
      entry_date: 'base.entry_date',
      guest_name: 'base.guest_name',
      driver_name: 'base.driver_name',
      vehicle_no: 'base.vehicle_no',
      trip_status: 'base.trip_status',
    };
    if (sortBy && !Object.keys(SORT_MAP).includes(sortBy)) {
      throw new BadRequestException('INVALID_SORT_FIELD');
    }
    // const sortColumn =
    //   SORT_MAP[sortBy ?? 'entry_date'] ?? SORT_MAP.entry_date;
    const sortColumn = sortBy
      ? SORT_MAP[sortBy as keyof typeof SORT_MAP]
      : SORT_MAP.entry_date;
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const allowedStatus = ['Scheduled', 'Entered', 'Inside', 'Exited', 'Cancelled', 'All'];

    if (status && !allowedStatus.includes(status)) {
      throw new BadRequestException('INVALID_STATUS');
    }
    /* ---------------- WHERE ---------------- */
    const where: string[] = [
      'io.is_active = TRUE',
      'g.is_active = TRUE',
    ];

    const sqlParams: any[] = [];
    let idx = 1;

    /* ---------------- SEARCH ---------------- */
    if (search) {
      const normalized = search.trim();

      if (!normalized) {
        throw new BadRequestException('INVALID_SEARCH');
      }

      if (normalized.length > 100) {
        throw new BadRequestException('SEARCH_TOO_LONG');
      }

      where.push(`(
        g.guest_name ILIKE $${idx}
        OR g.guest_mobile ILIKE $${idx}
        OR EXISTS (
          SELECT 1
          FROM t_guest_driver gd2
          JOIN m_driver d2 ON d2.driver_id = gd2.driver_id
          WHERE gd2.guest_id = g.guest_id
            AND gd2.is_active = TRUE
            AND d2.driver_name ILIKE $${idx}
        )
        OR EXISTS (
          SELECT 1
          FROM t_guest_driver gd2
          JOIN m_driver d2 ON d2.driver_id = gd2.driver_id
          JOIN m_staff s2 ON s2.staff_id = d2.staff_id
          WHERE gd2.guest_id = g.guest_id
            AND gd2.is_active = TRUE
            AND s2.is_active = TRUE
            AND s2.full_name ILIKE $${idx}
        )
      )`);

      sqlParams.push(`%${normalized}%`);
      idx++;
    }

    /* ---------------- ENTRY DATE RANGE ---------------- */
    let fromDate = entryDateFrom?.trim();
    let toDate = entryDateTo?.trim();
    if (entryDateFrom && isNaN(Date.parse(entryDateFrom))) {
      throw new BadRequestException('INVALID_ENTRY_DATE_FROM');
    }

    if (entryDateTo && isNaN(Date.parse(entryDateTo))) {
      throw new BadRequestException('INVALID_ENTRY_DATE_TO');
    }
    if (entryDateFrom && entryDateTo) {
      if (new Date(entryDateFrom) > new Date(entryDateTo)) {
        throw new BadRequestException('INVALID_DATE_RANGE');
      }
    }
    if (entryDateFrom && entryDateTo) {
      const diff =
        (new Date(entryDateTo).getTime() - new Date(entryDateFrom).getTime()) /
        (1000 * 60 * 60 * 24);

      if (diff > 90) {
        throw new BadRequestException('DATE_RANGE_TOO_LARGE');
      }
    }
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

      LEFT JOIN t_guest_driver gd
        ON gd.guest_id = g.guest_id
        AND gd.is_active = TRUE

      LEFT JOIN m_driver d
        ON d.driver_id = gd.driver_id
      LEFT JOIN m_staff s 
        ON s.staff_id = d.staff_id 
        AND s.is_active = TRUE

      LEFT JOIN t_guest_vehicle gv
        ON gv.guest_id = g.guest_id
        AND gv.is_active = TRUE

      LEFT JOIN m_vehicle v
        ON v.vehicle_no = gv.vehicle_no

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

          gd.guest_driver_id,
          gd.driver_id,
          s.full_name AS driver_name,
          s.primary_mobile AS driver_contact,
          d.driver_license,
          gd.pickup_location,
          gd.drop_location,
          gd.trip_date,
          gd.start_time,
          gd.drop_date,
          gd.drop_time,
          gd.trip_status,

          gv.guest_vehicle_id,
          v.vehicle_no,
          v.vehicle_name,
          v.model,
          v.color,
          v.capacity,
          gv.location,
          gv.assigned_at,
          gv.released_at

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
          FROM t_guest_driver
          WHERE guest_id = g.guest_id
            AND is_active = TRUE
          ORDER BY trip_date DESC, start_time DESC
          LIMIT 1
        ) gd ON TRUE

        LEFT JOIN m_driver d
          ON d.driver_id = gd.driver_id
        LEFT JOIN m_staff s ON s.staff_id = d.staff_id AND s.is_active = TRUE

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
      )
      SELECT
        base.*,

        CASE
          WHEN base.guest_driver_id IS NOT NULL
          AND (
            (base.trip_date::timestamp + COALESCE(base.start_time, TIME '00:00'))
              < (base.entry_date::timestamp + base.entry_time::time)
            OR
            COALESCE(
              (base.drop_date::timestamp + COALESCE(base.drop_time, TIME '23:59')),
              'infinity'
            ) >
            COALESCE(
              (base.exit_date::timestamp + COALESCE(base.exit_time, TIME '23:59')),
              'infinity'
            )
          )
          THEN TRUE
          ELSE FALSE
        END AS driver_conflict,

        CASE
          WHEN base.guest_vehicle_id IS NOT NULL
          AND (
            base.assigned_at <
              (base.entry_date::timestamp + base.entry_time::time)
            OR
            COALESCE(base.released_at, 'infinity') >
              (base.exit_date::timestamp + COALESCE(base.exit_time, TIME '23:59'))
          )
          THEN TRUE
          ELSE FALSE
        END AS vehicle_conflict

      FROM base
      ORDER BY ${sortColumn} ${order}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    return this.db.transaction(async (client) => {
      try {
      const countRes = await client.query(countSql, sqlParams);

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
  async findTransportConflictsForGuest(guestId: string, newEntry: Date, newExit: Date, client?: any) {
    if (!/^G\d+$/.test(guestId)) {
      throw new BadRequestException('INVALID_GUEST_ID');
    }
    if (!(newEntry instanceof Date) || isNaN(newEntry.getTime())) {
      throw new BadRequestException('INVALID_NEW_ENTRY_DATE');
    }

    if (!(newExit instanceof Date) || isNaN(newExit.getTime())) {
      throw new BadRequestException('INVALID_NEW_EXIT_DATE');
    }
    if (newExit <= newEntry) {
      throw new BadRequestException('INVALID_ENTRY_EXIT_RANGE');
    }

    const res = await client.query(
      `
      SELECT
        'DRIVER' AS type,
        gd.guest_driver_id AS ref_id,
        (gd.trip_date::timestamp + COALESCE(gd.start_time, TIME '00:00'))
 AS from_time,
        COALESCE(
          (gd.drop_date::timestamp + gd.drop_time::time),
          'infinity'
        ) AS to_time
      FROM t_guest_driver gd
      WHERE gd.guest_id = $1
        AND gd.is_active = TRUE
        AND (
          (gd.trip_date::timestamp + COALESCE(gd.start_time, TIME '00:00')),
          COALESCE((gd.drop_date::timestamp + COALESCE(gd.drop_time, TIME '23:59')), 'infinity')
        )
        OVERLAPS ($2, $3)

      UNION ALL

      SELECT
        'VEHICLE',
        gv.guest_vehicle_id,
        gv.assigned_at,
        COALESCE(gv.released_at, 'infinity')
      FROM t_guest_vehicle gv
      WHERE gv.guest_id = $1
        AND gv.is_active = TRUE
        AND (gv.assigned_at, COALESCE(gv.released_at, 'infinity'))
        OVERLAPS ($2, $3)
      `,
      [guestId, newEntry, newExit]
    );

    return res.rows;
  }

}
