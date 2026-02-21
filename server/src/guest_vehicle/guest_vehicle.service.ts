import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestVehicleDto } from './dto/create-guest-vehicle.dto';

@Injectable()
export class GuestVehicleService {
  constructor(private readonly db: DatabaseService) { }

  private async generateGuestVehicleId(client: any): Promise<string> {
    const res = await client.query(`
    SELECT 'GV' || LPAD(nextval('guest_vehicle_seq')::text, 3, '0') AS id
  `);
    return res.rows[0].id;
  }

  private async assertGuestIsAssignable(guestId: string, client: any) {
    const sql = `
      SELECT io.status
      FROM t_guest_inout io
      WHERE io.guest_id = $1
        AND io.is_active = TRUE
      ORDER BY io.inserted_at DESC
      LIMIT 1
      FOR UPDATE;
    `;

    const res = await client.query(sql, [guestId]);

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
        g.guest_name_local_language,
        g.remarks,

        d.designation_id,
        md.designation_name,
        md.designation_name_local_language,
        d.department,

        io.inout_id,
        io.entry_date,
        io.entry_time,
        io.exit_date,
        io.exit_time,
        io.requires_driver,

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
        v.capacity,
        v.manufacturing,
        v.color

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
        v.model,
        v.capacity,
        v.manufacturing,
        v.color

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
    user: string,
    ip: string
  ) {
  return this.db.transaction(async (client) => {
      // 🔒 Lock vehicle row
      await client.query(
        `SELECT 1 FROM m_vehicle WHERE vehicle_no = $1 FOR UPDATE`,
        [dto.vehicle_no]
      );

      // 🔒 Lock existing active assignments for vehicle
      await client.query(
        `
        SELECT 1
        FROM t_guest_vehicle
        WHERE vehicle_no = $1
          AND is_active = TRUE
        FOR UPDATE
        `,
        [dto.vehicle_no]
      );
      await this.assertGuestIsAssignable(dto.guest_id, client);

      await this.assertVehicleWithinGuestStay(
        client,
        dto.guest_id,
        dto.assigned_at,
        dto.released_at
      );

      await this.assertVehicleAvailability(
        client,
        dto.vehicle_no,
        dto.assigned_at,
        dto.released_at
      );
      const guestVehicleId = await this.generateGuestVehicleId(client);

      await client.query(`
        INSERT INTO t_guest_vehicle
            (guest_vehicle_id, guest_id, vehicle_no, location, assigned_at, released_at,
            is_active, inserted_at, inserted_by, inserted_ip, updated_at, updated_by, updated_ip)
        VALUES
            ($1,$2,$3,$4, $5, $6, TRUE, NOW(), $7, $8,  NULL, NULL, NULL)
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

      return { guest_vehicle_id: guestVehicleId };
    });
  }
  async autoCloseExpiredAssignments(
      user: string,
      ip: string
    ) {
      return this.db.transaction(async (client) => {
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

        const res = await client.query(sql, [user, ip]);
        return res.rows;
    });
  }
  
  // WRITE (future) — Release vehicle
  async releaseVehicle(
    guestVehicleId: string,
    user: string,
    ip: string,
  ) {
    return this.db.transaction(async (client) => {
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
      const res = await client.query(sql, [guestVehicleId, user, ip]);
      if (!res.rows.length) {
        throw new NotFoundException("Active vehicle assignment not found");
      }
      return res.rows[0];
    });
  }

  async getWithoutDriver() {
    const sql = `
      SELECT
        gv.guest_vehicle_id,
        gv.vehicle_no,
        v.vehicle_name,
        g.guest_name
      FROM t_guest_vehicle gv
      JOIN m_guest g ON g.guest_id = gv.guest_id
      JOIN m_vehicle v ON v.vehicle_no = gv.vehicle_no
      LEFT JOIN t_guest_driver gd
        ON gd.guest_id = gv.guest_id
        AND gd.is_active = TRUE
      WHERE gv.is_active = TRUE
        AND gd.guest_driver_id IS NULL;
    `;

    const res = await this.db.query(sql);
    return res.rows;
  }

  /**
     * Reassign a vehicle: close the old assignment and create a new one in a transaction.
     * If the new assignment fails, the old assignment remains active (rollback).
     */
  async reassignVehicle(
    oldGuestVehicleId: string,
    dto: CreateGuestVehicleDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      const old = await client.query(
        `
        SELECT guest_id, is_active
        FROM t_guest_vehicle
        WHERE guest_vehicle_id = $1
        FOR UPDATE
        `,
        [oldGuestVehicleId]
      );
      await client.query(
        `SELECT 1 FROM m_vehicle WHERE vehicle_no = $1 FOR UPDATE`,
        [dto.vehicle_no]
      );

      if (!old.rows.length) {
        throw new NotFoundException("Vehicle assignment not found");
      }

      await client.query(
        `
        SELECT 1
        FROM t_guest_vehicle
        WHERE vehicle_no = $1
          AND is_active = TRUE
        FOR UPDATE
        `,
        [dto.vehicle_no]
      );

      if (!old.rows[0].is_active) {
        throw new BadRequestException("Cannot reassign an expired vehicle assignment");
      }

      await this.assertGuestIsAssignable(old.rows[0].guest_id, client);

      await this.assertVehicleWithinGuestStay(
        client,
        old.rows[0].guest_id,
        dto.assigned_at,
        dto.released_at
      );

      await this.assertVehicleAvailability(
        client,
        dto.vehicle_no,
        dto.assigned_at,
        dto.released_at,
        oldGuestVehicleId
      );

        // 1️⃣ Close old assignment
        await client.query(
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
        const guestVehicleId = await this.generateGuestVehicleId(client);

        await client.query(`
          INSERT INTO t_guest_vehicle
              (guest_vehicle_id, guest_id, vehicle_no, location, assigned_at, released_at,
              is_active, inserted_at, inserted_by, inserted_ip)
          VALUES
              ($1,$2,$3,$4,$5,$6,TRUE,NOW(),$7,$8)
        `, [
          guestVehicleId,
          guestId,
          dto.vehicle_no,
          dto.location || null,
          dto.assigned_at,
          dto.released_at || null,
          user,
          ip
        ]);

        return { guest_vehicle_id: guestVehicleId };
    });
  }
  private async assertVehicleAvailability(
    client: any,
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
      LIMIT 1
      FOR UPDATE;
    `;

    const res = await client.query(sql, [
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
    client: any,
    guestId: string,
    assignedAt: string,
    releasedAt?: string
  ) {
    const res = await client.query(
      `
      SELECT
        (io.entry_date::timestamp + io.entry_time::time) AS entry_ts,
        (io.exit_date::timestamp + COALESCE(io.exit_time, TIME '23:59')) AS exit_ts
      FROM t_guest_inout io
      WHERE io.guest_id = $1
        AND io.is_active = TRUE
      ORDER BY io.inserted_at DESC
      LIMIT 1
      FOR UPDATE; 
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
    const assignedAtDate = new Date(assignedAt);
    const releasedAtDate = releasedAt ? new Date(releasedAt) : null;

    if (
      assignedAtDate < new Date(entry_ts) ||
      (releasedAtDate && releasedAtDate > new Date(exit_ts))
    ) {
      throw new BadRequestException(
        'Vehicle assignment is outside guest check-in / check-out period'
      );
    }

  }
}
