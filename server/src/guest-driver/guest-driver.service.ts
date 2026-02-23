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

  private async generateId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'GD' || LPAD(nextval('guest_driver_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
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
    return this.db.transaction(async (client) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        const id = await this.generateId(client);
        try {
          const res = await client.query(sql, paramsBuilder(id));
          return res.rows[0];
        } catch (err: any) {
          // Check for unique constraint violation (PostgreSQL error code 23505)
          if (err.code === '23505' && attempt < retries) {
            continue; // Retry with a new ID
          }
          throw err;
        }
      }
    });
  }

  private async assertGuestIsAssignable(client: any, guestId: string) {
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
      throw new BadRequestException("GUEST_STATUS_NOT_FOUND");    }

    const status = res.rows[0].status;

    if (["Exited", "Cancelled"].includes(status)) {
      throw new BadRequestException("GUEST_NOT_ASSIGNABLE");    }
  }

  // ---------- ASSIGN DRIVER ----------
  async assignDriver(
    dto: AssignGuestDriverDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
        await client.query(
          `SELECT 1 FROM m_driver WHERE driver_id = $1 FOR UPDATE`,
          [dto.driver_id]
        );

        await client.query(
          `
          SELECT 1
          FROM t_guest_driver
          WHERE driver_id = $1
            AND is_active = TRUE
          FOR UPDATE
          `,
          [dto.driver_id]
        );

        // 🔒 BLOCK assignment for exited / cancelled guests
        await this.assertGuestIsAssignable(client, dto.guest_id);
        await this.assertDriverNotOnWeekOff(
          client,
          dto.driver_id,
          dto.trip_date
        );
        await this.assertDriverOnDuty(
          client,
          dto.driver_id,
          dto.trip_date,
          dto.start_time,
          dto.drop_date,
          dto.drop_time
        );
        await this.assertDriverAvailability(
          client,
          dto.driver_id,
          dto.trip_date,
          dto.start_time,
          dto.drop_date,
          dto.drop_time
        );

        const trip = await this.createTrip(
          client,
          {
            guest_id: dto.guest_id,
            driver_id: dto.driver_id,
            pickup_location: dto.pickup_location,
            drop_location: dto.drop_location,
            trip_date: dto.trip_date,
            start_time: dto.start_time,
            drop_date: dto.drop_date,
            drop_time: dto.drop_time,
            // trip_status: dto.trip_status ?? "Scheduled",
          },
          user,
          ip
        );
        return trip;
    });
  }

  // ---------- CREATE TRIP ----------
  async createTrip(
    client: any,
    dto: CreateGuestDriverDto,
    user: string,
    ip: string
  ) {
    // return this.db.transaction(async (client) => {
      const id = await this.generateId(client);

      const sql = `
        INSERT INTO t_guest_driver(
          guest_driver_id, guest_id, driver_id,
          pickup_location, drop_location,
          trip_date, start_time, drop_date, drop_time,

          remarks,
          is_active,
          inserted_at, inserted_by, inserted_ip
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,
          $10,$11,$12,
          TRUE,
          NOW(),$13,$14
        )
        RETURNING *;
      `;

      const params = [
        id,
        dto.guest_id,
        dto.driver_id,
        // dto.vehicle_no ?? null,
        // dto.room_id ?? null,
        dto.pickup_location,
        dto.drop_location ?? null,
        dto.trip_date,
        dto.start_time,
        dto.drop_date ?? null,
        dto.drop_time ?? null,
        // dto.pickup_status ?? "Waiting",
        // dto.drop_status ?? "Waiting",
        // dto.trip_status ?? "Scheduled",
        dto.remarks ?? null,
        user,
        ip
      ];

      const res = await client.query(sql, params);
      return res.rows[0];
    // });
  }
  async createTripStandalone(
    dto: CreateGuestDriverDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {

      await this.assertGuestIsAssignable(client, dto.guest_id);

      await this.assertDriverNotOnWeekOff(
        client,
        dto.driver_id,
        dto.trip_date
      );

      await this.assertDriverOnDuty(
        client,
        dto.driver_id,
        dto.trip_date,
        dto.start_time,
        dto.drop_date,
        dto.drop_time
      );

      await this.assertDriverAvailability(
        client,
        dto.driver_id,
        dto.trip_date,
        dto.start_time,
        dto.drop_date,
        dto.drop_time
      );

      return this.createTrip(client, dto, user, ip);
    });
  }

  async findActiveByGuest(guestId: string) {
    const sql = `
    SELECT
      gd.guest_driver_id,
      gd.guest_id,
      gd.driver_id,

      d.driver_name,
      d.driver_name_local_language,
      d.driver_contact,
      d.driver_alternate_mobile,
      d.driver_license,
      d.license_expiry_date,

      gd.pickup_location,
      gd.drop_location,

      gd.trip_date,
      gd.start_time,

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

  async create(client, dto: CreateGuestDriverDto, user: string, ip: string) {
    // return this.db.transaction(async (client) => {
      const id = await this.generateId(client);
      try {
      const sql = `
        INSERT INTO t_guest_driver(
          guest_driver_id, guest_id, driver_id,
          pickup_location, drop_location,
          trip_date, start_time,
          drop_date, drop_time,
          remarks,
          is_active,
          inserted_at, inserted_by, inserted_ip
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,
          $10,
          true, NOW(), $11, $12
        )
        RETURNING *;
      `;

      const params = [
        id,
        dto.guest_id,
        dto.driver_id,
        dto.pickup_location,
        dto.drop_location ?? null,

        dto.trip_date,
        dto.start_time,
        dto.drop_date ?? null,
        dto.drop_time ?? null,

        dto.remarks ?? null,

        user,
        ip
      ];

      const res = await client.query(sql, params);
      // await this.db.query('COMMIT');
      return res.rows[0];
      } catch (err) {
        // await this.db.query('ROLLBACK');
        throw err;
      }
    // });
  }

  /**
   * Closes a trip by setting is_active = false.
   * Note: This is NOT a delete - the record remains for audit/history.
   */
  async autoCloseExpiredTrips(
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
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

    const res = await client.query(sql, [user, ip]);
    return res.rows;
    });
  }
  async closeTrip(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existing = await client.query(
        `SELECT 1 FROM t_guest_driver WHERE guest_driver_id = $1 FOR UPDATE`,
        [id]
      );

      if (!existing.rowCount) {
        throw new BadRequestException("TRIP_NOT_FOUND");
      }

      const res = await client.query(
        `
        UPDATE t_guest_driver SET 
          is_active = false,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE guest_driver_id = $3
        RETURNING *;
        `,
        [user, ip, id]
      );

      return res.rows[0];
    });
  }

  // async closeTrip(id: string, user: string, ip: string) {
  //   return this.db.transaction(async (client) => {
  //     try {
  //     const sql = `
  //       UPDATE t_guest_driver SET 
  //         is_active = false,
  //         updated_at = NOW(),
  //         updated_by = $1,
  //         updated_ip = $2
  //       WHERE guest_driver_id = $3
  //       RETURNING *;
  //     `;

  //     const res = await client.query(sql, [user, ip, id]);
  //     return res.rows[0];
  //     } catch (err) {
  //       throw err;
  //     }
  //   });
  // }
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
    // client: any,
    oldGuestDriverId: string,
    dto: Partial<CreateGuestDriverDto>,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      try{
      const oldRes = await client.query(
        `SELECT * FROM t_guest_driver WHERE guest_driver_id = $1 FOR UPDATE`,
        [oldGuestDriverId]
      );

      if (!oldRes.rowCount) {
        throw new BadRequestException('Trip not found');
      }

      const old = oldRes.rows[0];
      await client.query(
        `
        SELECT 1
        FROM t_guest_driver
        WHERE driver_id = $1
          AND is_active = TRUE
        FOR UPDATE
        `,
        [dto.driver_id ?? old.driver_id]
      );

      await this.assertGuestIsAssignable(client, old.guest_id);
      await this.assertDriverNotOnWeekOff(
        client,
        dto.driver_id ?? old.driver_id,
        dto.trip_date ?? old.trip_date
      );
      await this.assertDriverOnDuty(
        client,
        dto.driver_id ?? old.driver_id,
        dto.trip_date ?? old.trip_date,
        dto.start_time ?? old.start_time,
        dto.drop_date ?? old.drop_date,
        dto.drop_time ?? old.drop_time
      );
      await this.assertDriverAvailability(
        client,
        dto.driver_id ?? old.driver_id,
        dto.trip_date ?? old.trip_date,
        dto.start_time ?? old.start_time,
        dto.drop_date ?? old.drop_date,
        dto.drop_time ?? old.drop_time,
        oldGuestDriverId
      );

        // 1️⃣ Close old trip
        await client.query(
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
          client,
          {
            guest_id: old.guest_id,
            driver_id: dto.driver_id ?? old.driver_id,
            from_location: dto.from_location ?? old.from_location,
            to_location: dto.to_location ?? old.to_location,
            pickup_location: dto.pickup_location ?? old.pickup_location,
            drop_location: dto.drop_location ?? old.drop_location,
            trip_date: dto.trip_date ?? old.trip_date,
            start_time: dto.start_time ?? old.start_time,
            drop_date: dto.drop_date ?? old.drop_date,
            drop_time: dto.drop_time ?? old.drop_time,
            remarks: dto.remarks ?? old.remarks,
          } as CreateGuestDriverDto,
          user,
          ip
        );

        return newTrip;
      } catch (err) {
        throw err;
      }
    });
  }
  private async assertDriverAvailability(
    client: any,
    driverId: string,
    tripDate: string,
    startTime: string,
    dropDate?: string,
    dropTime?: string,
    excludeTripId?: string
  ) {
    // return this.db.transaction(async (client) => {
      const sql = `
        SELECT 1
        FROM t_guest_driver
        WHERE
          driver_id = $1
          AND is_active = TRUE
          AND guest_driver_id <> COALESCE($6, guest_driver_id)
          AND
          (
            (trip_date::date + start_time::time),
            CASE
              WHEN drop_date IS NOT NULL
                  AND drop_time IS NOT NULL
                  AND drop_time < start_time
                THEN drop_date::date + drop_time::time + INTERVAL '1 day'
              WHEN drop_date IS NOT NULL
                  AND drop_time IS NOT NULL
                THEN drop_date::date + drop_time::time
              ELSE 'infinity'
            END
          )
          OVERLAPS
          (
            $2::date + $3::time,
            CASE
              WHEN $4 IS NOT NULL
                  AND $5 IS NOT NULL
                  AND $5 < $3
                THEN $4::date + $5::time + INTERVAL '1 day'
              WHEN $4 IS NOT NULL
                  AND $5 IS NOT NULL
                THEN $4::date + $5::time
              ELSE 'infinity'
            END
          )
        FOR UPDATE
        LIMIT 1;
      `;

      const res = await client.query(sql, [
        driverId,
        tripDate,
        startTime,
        dropDate ?? null,
        dropTime ?? null, 
        excludeTripId ?? null,
      ]);

      if (res.rows.length) {
        throw new BadRequestException("DRIVER_ALREADY_ASSIGNED");
      }
    // });
  }

  private async assertDriverOnDuty(
    client: any,
    driverId: string,
    tripDate: string,
    startTime: string,
    dropDate?: string,
    dropTime?: string
  ) {
    // return this.db.transaction(async (client) => {
      const res = await client.query(
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
              CASE
                WHEN $4 IS NOT NULL AND $5 IS NOT NULL AND $5 < $3
                  THEN $4::date + $5::time + INTERVAL '1 day'
                WHEN $4 IS NOT NULL AND $5 IS NOT NULL
                  THEN $4::date + $5::time
                ELSE 'infinity'
              END
            )
            FOR UPDATE
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
    // });
  }
  private async assertDriverNotOnWeekOff(
    client: any,
    driverId: string,
    tripDate: string
  ) {
    // return this.db.transaction(async (client) => {

      const res = await client.query(
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
        FOR UPDATE
        `,
        [driverId, tripDate]
      );

      if (res.rows.length) {
        throw new BadRequestException("DRIVER_WEEK_OFF");
      }
    // });
  }
}