import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuestVehicleDto } from './dto/create-guest-vehicle.dto';

@Injectable()
export class GuestVehicleService {
  constructor(private readonly db: DatabaseService) {}

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
      LEFT JOIN m_designation md
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
  async findVehiclesByGuest(guestId: number) {
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
    await this.db.query('BEGIN');
    try {
        const guestVehicleId = await this.generateGuestVehicleId();

        await this.db.query(`
        INSERT INTO t_guest_vehicle
            (guest_vehicle_id, guest_id, vehicle_no, location,
            is_active, inserted_by, inserted_ip)
        VALUES
            ($1,$2,$3,$4, TRUE,$5,$6)
        `, [
        guestVehicleId,
        dto.guest_id,
        dto.vehicle_no,
        dto.location || null,
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
      RETURNING *;
    `;
    const res = await this.db.query(sql, [guestVehicleId, user, ip]);
    return res.rows[0];
  }
}
