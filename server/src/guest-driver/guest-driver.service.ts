import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { UpdateGuestDriverDto } from "./dto/update-guest-driver.dto";
import { AssignGuestDriverDto } from "./dto/assign-guest-driver.dto";
// import { NotificationsService } from '../notifications/notifications.service';
import { CreateGuestDriverDto } from "./dto/create-guest-driver.dto";

@Injectable()
export class GuestDriverService {
  constructor(
    private readonly db: DatabaseService,
    // private readonly notifications: NotificationsService,
  ) { }

  private async generateId(retries = 3): Promise<string> {
    const sql = `SELECT guest_driver_id FROM t_guest_driver ORDER BY guest_driver_id DESC LIMIT 1`;
    const res = await this.db.query(sql);

    if (res.rows.length === 0) return "GD001";

    const last = res.rows[0].guest_driver_id.replace("GD", "");
    const next = (parseInt(last) + 1).toString().padStart(3, "0");

    return "GD" + next;
  }


  /**
   * Insert helper with retry logic to handle race conditions on ID generation.
   * If a unique constraint violation occurs, it regenerates the ID and retries.
   */
  private async insertWithRetry(
    sql: string,
    paramsBuilder: (id: string) => any[],
    retries = 3
  ): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const id = await this.generateId();
      try {
        const res = await this.db.query(sql, paramsBuilder(id));
        return res.rows[0];
      } catch (err: any) {
        // Check for unique constraint violation (PostgreSQL error code 23505)
        if (err.code === '23505' && attempt < retries) {
          continue; // Retry with a new ID
        }
        throw err;
      }
    }
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
      throw new BadRequestException("GUEST_STATUS_NOT_FOUND");    }

    const status = res.rows[0].status;

    if (["Exited", "Cancelled"].includes(status)) {
      throw new BadRequestException("GUEST_NOT_ASSIGNABLE");    }
  }

  // ---------- ASSIGN DRIVER ----------
  async assignDriver(
    dto: AssignGuestDriverDto,
    user = "system",
    ip = "0.0.0.0"
  ) {
    // 🔒 BLOCK assignment for exited / cancelled guests
    await this.assertGuestIsAssignable(dto.guest_id);
    await this.assertDriverNotOnWeekOff(
      dto.driver_id,
      dto.trip_date
    );
    await this.assertDriverOnDuty(
      dto.driver_id,
      dto.trip_date,
      dto.start_time,
      dto.drop_date,
      dto.drop_time
    );
    await this.assertDriverAvailability(
      dto.driver_id,
      dto.trip_date,
      dto.start_time,
      dto.drop_date,
      dto.drop_time
    );

    return this.createTrip(
      {
        guest_id: dto.guest_id,
        driver_id: dto.driver_id,
        pickup_location: dto.pickup_location,
        drop_location: dto.drop_location,
        trip_date: dto.trip_date,
        start_time: dto.start_time,
        end_time: dto.end_time,
        // trip_status: dto.trip_status ?? "Scheduled",
      },
      user,
      ip
    );
  }


  // ---------- CREATE TRIP ----------
  async createTrip(
    dto: CreateGuestDriverDto,
    user: string,
    ip: string
  ) {
    const id = await this.generateId();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO t_guest_driver(
        guest_driver_id, guest_id, driver_id, vehicle_no, room_id,
        from_location, to_location, pickup_location, drop_location,
        trip_date, start_time, end_time,
        drop_date, drop_time,

        remarks,
        is_active,
        inserted_at, inserted_by, inserted_ip
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,
        $10,$11,$12,
        $13,$14,
        $15,
        TRUE,
        $16,$17,$18
      )
      RETURNING *;
    `;

    const params = [
      id,
      dto.guest_id,
      dto.driver_id,
      dto.vehicle_no ?? null,
      dto.room_id ?? null,
      dto.from_location ?? null,
      dto.to_location ?? null,
      dto.pickup_location,
      dto.drop_location ?? null,
      dto.trip_date,
      dto.start_time,
      dto.end_time ?? null,
      dto.drop_date ?? null,
      dto.drop_time ?? null,
      // dto.pickup_status ?? "Waiting",
      // dto.drop_status ?? "Waiting",
      // dto.trip_status ?? "Scheduled",
      dto.remarks ?? null,
      now,
      user,
      ip
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  async findActiveByGuest(guestId: string) {
    const sql = `
    SELECT
      gd.guest_driver_id,
      gd.guest_id,
      gd.driver_id,

      d.driver_name,
      d.driver_contact,

      gd.pickup_location,
      gd.drop_location,

      gd.trip_date,
      gd.start_time,
      gd.end_time,

      gd.drop_date,
      gd.drop_time,

      gd.trip_status
    FROM t_guest_driver gd
    JOIN m_driver d
      ON d.driver_id = gd.driver_id
    WHERE gd.guest_id = $1
      AND gd.is_active = TRUE
    ORDER BY gd.inserted_at DESC
    LIMIT 1;
  `;

    const res = await this.db.query(sql, [guestId]);
    return res.rows[0] || null;
  }


  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM t_guest_driver WHERE is_active = $1 ORDER BY trip_date DESC`
      : `SELECT * FROM t_guest_driver ORDER BY trip_date DESC`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_guest_driver WHERE guest_driver_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestDriverDto, user: string, ip: string) {
    const id = await this.generateId();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO t_guest_driver(
        guest_driver_id, guest_id, driver_id, vehicle_no, room_id,
        from_location, to_location, pickup_location, drop_location,
        trip_date, start_time, end_time,
        drop_date, drop_time,

        remarks,
        is_active,
        inserted_at, inserted_by, inserted_ip
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,
        $10,$11,$12,
        $13,$14,
        $15,
        true,
        $16,$17,$18
      )
      RETURNING *;
    `;

    const params = [
      id,
      dto.guest_id,
      dto.driver_id,
      dto.vehicle_no ?? null,
      dto.room_id ?? null,

      dto.from_location ?? null,
      dto.to_location ?? null,
      dto.pickup_location,
      dto.drop_location ?? null,

      dto.trip_date,
      dto.start_time,
      dto.end_time ?? null,

      dto.drop_date ?? null,
      dto.drop_time ?? null,

      // dto.pickup_status ?? "Waiting",
      // dto.drop_status ?? "Waiting",
      // dto.trip_status ?? "Scheduled",

      dto.remarks ?? null,

      now,
      user,
      ip
    ];

    const res = await this.db.query(sql, params);
    return res.rows[0];
  }

  // async update(id: string, dto: UpdateGuestDriverDto, user: string, ip: string) {
  //   const existing = await this.findOne(id);
  //   if (!existing) throw new BadRequestException(`Guest Driver Entry '${id}' not found`);

  //   const now = new Date().toISOString();

  //   const sql = `
  //     UPDATE t_guest_driver SET
  //       driver_id = $1,
  //       vehicle_no = $2,
  //       room_id = $3,

  //       from_location = $4,
  //       to_location = $5,
  //       pickup_location = $6,
  //       drop_location = $7,

  //       trip_date = $8,
  //       start_time = $9,
  //       end_time = $10,

  //       drop_date = $11,
  //       drop_time = $12,

  //       remarks = $13,
  //       is_active = $14,

  //       updated_at = $15,
  //       updated_by = $16,
  //       updated_ip = $17
  //     WHERE guest_driver_id = $18
  //     RETURNING *;
  //   `;

  //   const params = [
  //     dto.driver_id ?? existing.driver_id,
  //     dto.vehicle_no ?? existing.vehicle_no,
  //     dto.room_id ?? existing.room_id,

  //     dto.from_location ?? existing.from_location,
  //     dto.to_location ?? existing.to_location,
  //     dto.pickup_location ?? existing.pickup_location,
  //     dto.drop_location ?? existing.drop_location,

  //     dto.trip_date ?? existing.trip_date,
  //     dto.start_time ?? existing.start_time,
  //     dto.end_time ?? existing.end_time,

  //     dto.drop_date ?? existing.drop_date,
  //     dto.drop_time ?? existing.drop_time,

  //     // dto.pickup_status ?? existing.pickup_status,
  //     // dto.drop_status ?? existing.drop_status,
  //     // dto.trip_status ?? existing.trip_status,

  //     dto.remarks ?? existing.remarks,
  //     dto.is_active ?? existing.is_active,

  //     now,
  //     user,
  //     ip,

  //     id
  //   ];

  //   const res = await this.db.query(sql, params);
  //   return res.rows[0];
  // }

  /**
   * Closes a trip by setting is_active = false.
   * Note: This is NOT a delete - the record remains for audit/history.
   */
  async autoCloseExpiredTrips(
  user = "system",
  ip = "0.0.0.0"
) {
  const sql = `
    UPDATE t_guest_driver
    SET
      is_active = FALSE,
      updated_at = NOW(),
      updated_by = $1,
      updated_ip = $2
    WHERE
      is_active = TRUE
      AND
        (trip_date::timestamp + start_time::time) <= NOW()
      AND
        drop_date IS NOT NULL
      AND
        drop_time IS NOT NULL
      AND
        (drop_date::timestamp + drop_time::time) <= NOW()
    RETURNING guest_driver_id;
  `;

  const res = await this.db.query(sql, [user, ip]);
  return res.rows;
}

  async closeTrip(id: string, user: string, ip: string) {
    const now = new Date().toISOString();

    const sql = `
      UPDATE t_guest_driver SET 
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE guest_driver_id = $4
      RETURNING *;
    `;

    const res = await this.db.query(sql, [now, user, ip, id]);
    return res.rows[0];
  }
  //   async updateTrip(
  //   guestDriverId: string,
  //   payload: {
  //     trip_status?: string;
  //     start_time?: string;
  //     end_time?: string;
  //     pickup_location?: string;
  //     drop_location?: string;
  //   },
  //   user: string,
  //   ip: string
  // ) {
  //   // 🔑 Normalize empty strings → null
  //   const cleanPayload = {
  //     trip_status: payload.trip_status ?? null,
  //     start_time: payload.start_time === "" ? null : payload.start_time,
  //     end_time: payload.end_time === "" ? null : payload.end_time,
  //     pickup_location: payload.pickup_location === "" ? null : payload.pickup_location,
  //     drop_location: payload.drop_location === "" ? null : payload.drop_location,
  //   };

  //   const sql = `
  //     UPDATE t_guest_driver
  //     SET
  //       trip_status = COALESCE($2, trip_status),
  //       start_time = COALESCE($3, start_time),
  //       end_time = COALESCE($4, end_time),
  //       pickup_location = COALESCE($5, pickup_location),
  //       drop_location = COALESCE($6, drop_location),
  //       updated_at = NOW(),
  //       updated_by = $7,
  //       updated_ip = $8
  //     WHERE guest_driver_id = $1
  //       AND is_active = TRUE
  //     RETURNING *;
  //   `;

  //   const res = await this.db.query(sql, [
  //     guestDriverId,
  //     cleanPayload.trip_status,
  //     cleanPayload.start_time,
  //     cleanPayload.end_time,
  //     cleanPayload.pickup_location,
  //     cleanPayload.drop_location,
  //     user,
  //     ip,
  //   ]);

  //   return res.rows[0];
  // }
  /**
     * Revise a trip: close the old one and insert a new one in a transaction.
     * If the insert fails, the old trip remains active (rollback).
     */
  async reviseTrip(
    oldGuestDriverId: string,
    dto: Partial<CreateGuestDriverDto>,
    user: string,
    ip: string
  ) {
    const old = await this.findOne(oldGuestDriverId);
    if (!old) throw new BadRequestException('Trip not found');

    await this.assertGuestIsAssignable(old.guest_id);
    await this.assertDriverOnDuty(
      dto.driver_id ?? old.driver_id,
      dto.trip_date ?? old.trip_date,
      dto.start_time ?? old.start_time,
      dto.drop_date ?? old.drop_date,
      dto.drop_time ?? old.drop_time
    );
    await this.assertDriverAvailability(
      dto.driver_id ?? old.driver_id,
      dto.trip_date ?? old.trip_date,
      dto.start_time ?? old.start_time,
      dto.drop_date ?? old.drop_date,
      dto.drop_time ?? old.drop_time
    );

    // Use transaction to ensure atomic operation
    await this.db.query('BEGIN');

    try {
      // 1️⃣ Close old trip
      await this.db.query(
        `
        UPDATE t_guest_driver
        SET is_active = FALSE,
            updated_at = NOW(),
            updated_by = $2,
            updated_ip = $3
        WHERE guest_driver_id = $1
        `,
        [oldGuestDriverId, user, ip]
      );

      // 2️⃣ Insert   `d trip as NEW ROW
      const newTrip = await this.create(
        {
          guest_id: old.guest_id,
          driver_id: dto.driver_id ?? old.driver_id,
          vehicle_no: dto.vehicle_no ?? old.vehicle_no,
          room_id: dto.room_id ?? old.room_id,

          from_location: dto.from_location ?? old.from_location,
          to_location: dto.to_location ?? old.to_location,
          pickup_location: dto.pickup_location ?? old.pickup_location,
          drop_location: dto.drop_location ?? old.drop_location,

          trip_date: dto.trip_date ?? old.trip_date,
          start_time: dto.start_time ?? old.start_time,
          end_time: dto.end_time ?? old.end_time,

          drop_date: dto.drop_date ?? old.drop_date,
          drop_time: dto.drop_time ?? old.drop_time,

          remarks: dto.remarks ?? old.remarks,
        } as CreateGuestDriverDto,
        user,
        ip
      );

      await this.db.query('COMMIT');
      return newTrip;
    } catch (err) {
      await this.db.query('ROLLBACK');
      throw err;
    }
  }
  private async assertDriverAvailability(
    driverId: string,
    tripDate: string,
    startTime: string,
    dropDate?: string,
    dropTime?: string
  ) {
    const sql = `
      SELECT 1
      FROM t_guest_driver
      WHERE
        driver_id = $1
        AND is_active = TRUE
        AND (
          (trip_date::timestamp + start_time::time),
          COALESCE(
            (drop_date::timestamp + drop_time::time),
            'infinity'
          )
        )
        OVERLAPS
        (
          ($2::date + $3::time),
          COALESCE(($4::date + $5::time), 'infinity')
        )
      LIMIT 1;
    `;

    const res = await this.db.query(sql, [
      driverId,
      tripDate,
      startTime,
      dropDate ?? null,
      dropTime ?? null,
    ]);

    if (res.rows.length) {
      throw new BadRequestException("DRIVER_ALREADY_ASSIGNED");
    }
  }
  // private async assertDriverOnDuty(
  //   driverId: string,
  //   tripDate: string,
  //   startTime: string,
  //   dropDate?: string,
  //   dropTime?: string
  // ) {
  //   const res = await this.db.query(
  //     `
  //     SELECT 1
  //     FROM t_driver_duty
  //     WHERE driver_id = $1
  //       AND duty_date = $2
  //       AND is_active = TRUE
  //       AND is_week_off = FALSE
  //       AND (
  //         (duty_date::timestamp + duty_in_time::time),
  //         (duty_date::timestamp + duty_out_time::time)
  //       )
  //       OVERLAPS
  //       (
  //         ($2::date + $3::time),
  //         COALESCE(($4::date + $5::time), 'infinity')
  //       )
  //     `,
  //     [driverId, tripDate, startTime, dropDate ?? tripDate, dropTime ?? null]
  //   );

  //   if (!res.rows.length) {
  //     throw new BadRequestException(
  //       'Driver is not on duty during the selected time'
  //     );
  //   }
  // }
  // private async assertDriverOnDuty(
  //   driverId: string,
  //   tripDate: string,
  //   startTime: string,
  //   dropDate?: string,
  //   dropTime?: string
  // ) {
  //   const res = await this.db.query(
  //     `
  //     SELECT 1
  //     FROM t_driver_duty
  //     WHERE driver_id = $1
  //       AND duty_date = $2
  //       AND is_active = TRUE
  //       AND is_week_off = FALSE
  //       AND (
  //         /* ---------- DUTY WINDOW (handles night shifts) ---------- */
  //         (
  //           duty_date::timestamp + duty_in_time::time,
  //           CASE
  //             WHEN duty_out_time < duty_in_time
  //               THEN duty_date::timestamp + duty_out_time::time + INTERVAL '1 day'
  //             ELSE duty_date::timestamp + duty_out_time::time
  //           END
  //         )
  //       )
  //       OVERLAPS
  //       (
  //         /* ---------- TRIP WINDOW ---------- */
  //         ($2::date + $3::time),
  //         COALESCE(($4::date + $5::time), 'infinity')
  //       )
  //     `,
  //     [
  //       driverId,
  //       tripDate,
  //       startTime,
  //       dropDate ?? tripDate,
  //       dropTime ?? null
  //     ]
  //   );

  //   if (!res.rows.length) {
  //     throw new BadRequestException('Driver is not on duty during the selected time');
  //   }
  // }
  private async assertDriverOnDuty(
    driverId: string,
    tripDate: string,
    startTime: string,
    dropDate?: string,
    dropTime?: string
  ) {
    const res = await this.db.query(
      `
      SELECT 1
      FROM t_driver_duty
      WHERE driver_id = $1
        AND duty_date = $2
        AND is_active = TRUE
        AND is_week_off = FALSE
        AND
          (
            duty_date::timestamp + duty_in_time::time,
            CASE
              WHEN duty_out_time < duty_in_time
                THEN duty_date::timestamp + duty_out_time::time + INTERVAL '1 day'
              ELSE duty_date::timestamp + duty_out_time::time
            END
          )
          OVERLAPS
          (
            $2::date + $3::time,
            COALESCE($4::date + $5::time, 'infinity')
          )
      `,
      [
        driverId,
        tripDate,
        startTime,
        dropDate ?? null,
        dropTime ?? null
      ]
    );

    if (!res.rows.length) {
      throw new BadRequestException("DRIVER_NOT_ON_DUTY");
    }
  }
  private async assertDriverNotOnWeekOff(
    driverId: string,
    tripDate: string
  ) {
    const res = await this.db.query(
      `
      SELECT 1
      FROM t_driver_duty d
      WHERE d.driver_id = $1
        AND d.duty_date = $2
        AND d.is_active = TRUE
        AND d.is_week_off = TRUE

      UNION

      SELECT 1
      FROM t_driver_week_off w
      WHERE w.driver_id = $1
        AND w.weekday = EXTRACT(DOW FROM $2::date)
        AND w.is_active = TRUE
      LIMIT 1
      `,
      [driverId, tripDate]
    );

    if (res.rows.length) {
      throw new BadRequestException("DRIVER_WEEK_OFF");
    }
  }
}
