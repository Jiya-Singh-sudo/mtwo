import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestVehicleDto } from './dto/create-guest-vehicle.dto';

@Injectable()
export class GuestVehicleService {
  constructor(private readonly db: DatabaseService) { }

  private async generateGuestVehicleId(): Promise<string> {
    const sql = `
        SELECT guest_vehicle_id
        FROM t_guest_vehicle
        ORDER BY guest_vehicle_id DESC
        LIMIT 1;
    `;

    const res = await this.db.query(sql);

    if (res.rowCount === 0) {
      return 'GV001';
    }

    const lastId: string = res.rows[0].guest_vehicle_id; // e.g. GV023
    const num = parseInt(lastId.replace('GV', ''), 10) + 1;

    return `GV${num.toString().padStart(3, '0')}`;
  }


  private async assertGuestIsAssignable(guestId: string) {
    const sql = `
      SELECT io.status
      FROM t_guest_inout io
      WHERE io.guest_id = $1
        AND io.is_active = TRUE
      ORDER BY io.inserted_at DESC
      LIMIT 1
    `;

    const res = await this.db.query(sql, [guestId]);

    if (!res.rows.length) {
      throw new NotFoundException("Guest status not found");
    }

    const status = res.rows[0].status;

    if (["Exited", "Cancelled"].includes(status)) {
      throw new BadRequestException(
        `Cannot assign vehicle to guest with status '${status}'`
      );
    }
  }

  async findActiveByGuest(guestId: string) {
    const sql = `
      SELECT *
      FROM t_guest_vehicle
      WHERE guest_id = $1
        AND is_active = true
      ORDER BY inserted_at DESC
      LIMIT 1
    `;
    const res = await this.db.query(sql, [guestId]);
    return res.rows[0] || null;
  }

  // READ #1 — Guests checked-in but without vehicle
  async findCheckedInGuestsWithoutVehicle() {
    const sql = `
      SELECT
        g.guest_id,
        g.guest_name,

        d.designation_id,
        md.designation_name,
        d.department,

        io.inout_id,
        io.entry_date,
        io.entry_time

      FROM t_guest_inout io
      JOIN m_guest g
        ON g.guest_id = io.guest_id
      LEFT JOIN t_guest_designation d
        ON d.guest_id = g.guest_id
       AND d.is_current = TRUE
       AND d.is_active = TRUE
      LEFT JOIN m_guest_designation md
        ON md.designation_id = d.designation_id
      LEFT JOIN t_guest_vehicle gv
        ON gv.guest_id = g.guest_id
       AND gv.is_active = TRUE

      WHERE
        io.is_active = TRUE
        AND io.status IN ('Entered', 'Inside')
        AND g.is_active = TRUE
        AND gv.guest_id IS NULL

      ORDER BY io.entry_date DESC, io.entry_time DESC;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }

  // READ #2 — Vehicles available for assignment
  async findAssignableVehicles() {
    const sql = `
      SELECT
        v.vehicle_no,
        v.vehicle_name,
        v.model,
        v.capacity

      FROM m_vehicle v
      LEFT JOIN t_guest_vehicle gv
        ON gv.vehicle_no = v.vehicle_no
       AND gv.is_active = TRUE

      WHERE
        v.is_active = TRUE
        AND gv.vehicle_no IS NULL

      ORDER BY v.vehicle_name;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }

  // READ #3 — Vehicles assigned to a specific guest
  async findVehiclesByGuest(guestId: string) {
    const sql = `
      SELECT
        gv.guest_vehicle_id,
        gv.assigned_at,
        gv.released_at,
        gv.location,
        gv.is_active AS assignment_active,

        v.vehicle_no,
        v.vehicle_name,
        v.model

      FROM t_guest_vehicle gv
      JOIN m_vehicle v
        ON v.vehicle_no = gv.vehicle_no

      WHERE gv.guest_id = $1
      ORDER BY gv.assigned_at DESC;
    `;

    const res = await this.db.query(sql, [guestId]);
    return res.rows;
  }

  // WRITE — Assign vehicle to guest
  async assignVehicle(
    dto: CreateGuestVehicleDto,
    user = 'system',
    ip = '0.0.0.0'
  ) {
    await this.assertGuestIsAssignable(dto.guest_id);
    await this.assertVehicleAvailability(
      dto.vehicle_no,
      dto.assigned_at,
      dto.released_at
    );
    await this.db.query('BEGIN');
    try {
      const guestVehicleId = await this.generateGuestVehicleId();

      await this.db.query(`
        INSERT INTO t_guest_vehicle
            (guest_vehicle_id, guest_id, vehicle_no, location, assigned_at, released_at,
            is_active, inserted_by, inserted_ip)
        VALUES
            ($1,$2,$3,$4, $5, $6, TRUE,$7,$8)
        `, [
        guestVehicleId,
        dto.guest_id,
        dto.vehicle_no,
        dto.location || null,
        dto.assigned_at,
        dto.released_at || null,
        user,
        ip
      ]);

      await this.db.query('COMMIT');
      return { guest_vehicle_id: guestVehicleId };
    } catch (err) {
      await this.db.query('ROLLBACK');
      throw err;
    }
  }
  async autoCloseExpiredAssignments(
    user = 'system',
    ip = '0.0.0.0'
  ) {
    const sql = `
      UPDATE t_guest_vehicle
      SET
        is_active = FALSE,
        updated_at = NOW(),
        updated_by = $1,
        updated_ip = $2
      WHERE
        is_active = TRUE
        AND released_at IS NOT NULL
        AND released_at <= NOW()
      RETURNING guest_vehicle_id;
    `;

    const res = await this.db.query(sql, [user, ip]);
    return res.rows;
  }

  // WRITE (future) — Release vehicle
  async releaseVehicle(
    guestVehicleId: string,
    user = 'system',
    ip = '0.0.0.0'
  ) {
    const sql = `
      UPDATE t_guest_vehicle
      SET
        is_active = FALSE,
        released_at = NOW(),
        updated_at = NOW(),
        updated_by = $2,
        updated_ip = $3
      WHERE guest_vehicle_id = $1
        AND is_active = TRUE
      RETURNING *;
    `;
    const res = await this.db.query(sql, [guestVehicleId, user, ip]);
    return res.rows[0];
  }
  async getWithoutDriver() {
    const sql = `
      SELECT
        gv.guest_vehicle_id,
        gv.vehicle_no,
        g.guest_name
      FROM t_guest_vehicle gv
      JOIN m_guest g ON g.guest_id = gv.guest_id
      LEFT JOIN t_guest_driver gd
        ON gd.guest_id = gv.guest_id
        AND gd.is_active = TRUE
      WHERE gv.is_active = TRUE
        AND gd.guest_driver_id IS NULL;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }

  // async getWithoutDriver() {
  //   const sql = `
  //   SELECT
  //     gv.guest_vehicle_id,
  //     gv.vehicle_no,
  //     g.guest_name
  //   FROM t_guest_vehicle gv
  //   JOIN m_guest g ON g.guest_id = gv.guest_id
  //   WHERE gv.driver_id IS NULL
  //     AND gv.is_active = TRUE;
  // `;

  //   const res = await this.db.query(sql);
  //   return res.rows;
  // }
  //   async updateVehicleAssignment(
  //   guestVehicleId: string,
  //   payload: {
  //     location?: string;
  //     released_at?: string;
  //   },
  //   user: string,
  //   ip: string
  // ) {
  //   const sql = `
  //     UPDATE t_guest_vehicle
  //     SET
  //       location = COALESCE($2, location),
  //       released_at = COALESCE($3, released_at),
  //       updated_at = NOW(),
  //       updated_by = $4,
  //       updated_ip = $5
  //     WHERE guest_vehicle_id = $1
  //       AND is_active = TRUE
  //     RETURNING *;
  //   `;

  //   const res = await this.db.query(sql, [
  //     guestVehicleId,
  //     payload.location,
  //     payload.released_at,
  //     user,
  //     ip,
  //   ]);

  //   return res.rows[0];
  // }
  /**
     * Reassign a vehicle: close the old assignment and create a new one in a transaction.
     * If the new assignment fails, the old assignment remains active (rollback).
     */
  async reassignVehicle(
    oldGuestVehicleId: string,
    dto: CreateGuestVehicleDto,
    user = 'system',
    ip = '0.0.0.0'
  ) {
    const old = await this.db.query(
      `SELECT guest_id, is_active FROM t_guest_vehicle WHERE guest_vehicle_id = $1`,
      [oldGuestVehicleId]
    );

    if (!old.rows.length) {
      throw new NotFoundException("Vehicle assignment not found");
    }

    if (!old.rows[0].is_active) {
      throw new BadRequestException("Cannot reassign an expired vehicle assignment");
    }

    await this.assertGuestIsAssignable(old.rows[0].guest_id);

    await this.assertVehicleWithinGuestStay(
      old.rows[0].guest_id,
      dto.assigned_at,
      dto.released_at
    );

    await this.assertVehicleAvailability(
      dto.vehicle_no,
      dto.assigned_at,
      dto.released_at,
      oldGuestVehicleId
    );

    // await this.assertGuestIsAssignable(dto.guest_id);
    await this.db.query('BEGIN');

    try {
      // 1️⃣ Close old assignment
      await this.db.query(
        `
        UPDATE t_guest_vehicle
        SET
          is_active = FALSE,
          released_at = NOW(),
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
        WHERE guest_vehicle_id = $1
        `,
        [oldGuestVehicleId, user, ip]
      );
      // store once for clarity
      const guestId = old.rows[0].guest_id;

      // 2️⃣ Create new assignment (assignVehicle has its own transaction, so we inline the insert)
      const guestVehicleId = await this.generateGuestVehicleId();

      await this.db.query(`
        INSERT INTO t_guest_vehicle
            (guest_vehicle_id, guest_id, vehicle_no, location, assigned_at, released_at,
            is_active, inserted_by, inserted_ip)
        VALUES
            ($1,$2,$3,$4,$5,$6,TRUE,$7,$8)
      `, [
        guestVehicleId,
        guestId,                 // ✅ FIX: DO NOT use dto.guest_id
        dto.vehicle_no,
        dto.location || null,
        dto.assigned_at,
        dto.released_at || null,
        user,
        ip
      ]);

      await this.db.query('COMMIT');
      return { guest_vehicle_id: guestVehicleId };
    } catch (err) {
      await this.db.query('ROLLBACK');
      throw err;
    }
  }
  private async assertVehicleAvailability(
    vehicleNo: string,
    assignedAt: string,
    releasedAt?: string,
    excludeGuestVehicleId?: string
  ) {
    const sql = `
      SELECT 1
      FROM t_guest_vehicle
      WHERE
        vehicle_no = $1
        AND is_active = TRUE
        AND guest_vehicle_id <> COALESCE($4, guest_vehicle_id)
        AND (
          assigned_at,
          COALESCE(released_at, 'infinity')
        )
        OVERLAPS
        (
          $2::timestamp,
          COALESCE($3::timestamp, 'infinity')
        )
      LIMIT 1;
    `;

    const res = await this.db.query(sql, [
      vehicleNo,
      assignedAt,
      releasedAt ?? null,
      excludeGuestVehicleId ?? null
    ]);

    if (res.rows.length) {
      throw new BadRequestException(
        `Vehicle ${vehicleNo} is already assigned during the selected time`
      );
    }
  }
  private async assertVehicleWithinGuestStay(
    guestId: string,
    assignedAt: string,
    releasedAt?: string
  ) {
    const res = await this.db.query(
      `
      SELECT
        (io.entry_date::timestamp + io.entry_time::time) AS entry_ts,
        (io.exit_date::timestamp + COALESCE(io.exit_time, TIME '23:59')) AS exit_ts
      FROM t_guest_inout io
      WHERE io.guest_id = $1
        AND io.is_active = TRUE
      ORDER BY io.inserted_at DESC
      LIMIT 1
      `,
      [guestId]
    );

    if (!res.rows.length) return;

    const { entry_ts, exit_ts } = res.rows[0];

    if (
      assignedAt < entry_ts ||
      (releasedAt && releasedAt > exit_ts)
    ) {
      throw new BadRequestException(
        'Vehicle assignment is outside guest check-in / check-out period'
      );
    }
  }

}
