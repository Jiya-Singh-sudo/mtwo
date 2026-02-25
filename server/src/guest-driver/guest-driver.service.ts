import { BadRequestException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { UpdateGuestDriverDto } from "./dto/update-guest-driver.dto";
import { AssignGuestDriverDto } from "./dto/assign-guest-driver.dto";
// import { NotificationsService } from '../notifications/notifications.service';
import { CreateGuestDriverDto } from "./dto/create-guest-driver.dto";
import { ActivityLogService } from "src/activity-log/activity-log.service";
@Injectable()
export class GuestDriverService {
  constructor(
    private readonly db: DatabaseService,
    private readonly activityLog: ActivityLogService,
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
      throw new BadRequestException("Guest status not found!");    }

    const status = res.rows[0].status;

    if (["Exited", "Cancelled"].includes(status)) {
      throw new BadRequestException("Guest not assignable!");    }
  }

  // ---------- ASSIGN DRIVER ----------
  async assignDriver(
    dto: AssignGuestDriverDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      if (!/^G\d+$/.test(dto.guest_id)) {
        throw new BadRequestException("Invalid guest ID!");
      }
      if (!/^D\d+$/.test(dto.driver_id)) {
        throw new BadRequestException("Invalid driver ID!");
      }
      if (!dto.trip_date || isNaN(Date.parse(dto.trip_date))) {
        throw new BadRequestException("Invalid trip date!");
      }
      if (dto.drop_date && isNaN(Date.parse(dto.drop_date))) {
        throw new BadRequestException("Invalid drop date!");
      }
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!dto.start_time || !timeRegex.test(dto.start_time)) {
        throw new BadRequestException("Invalid start time!");
      }
      if (dto.drop_time && !timeRegex.test(dto.drop_time)) {
        throw new BadRequestException("Invalid drop time!");
      }
      if (dto.drop_date && dto.drop_time) {
        const start = new Date(`${dto.trip_date}T${dto.start_time}`);
        const end = new Date(`${dto.drop_date}T${dto.drop_time}`);

        if (end <= start) {
          throw new BadRequestException("Invalid trip duration!");
        }
      }
      if (dto.pickup_location && dto.pickup_location.length > 255) {
        throw new BadRequestException("Pickup location too long!");
      }
      if (dto.drop_location && dto.drop_location.length > 255) {
        throw new BadRequestException("Drop location too long!");
      }
      const now = new Date();
      const start = new Date(`${dto.trip_date}T${dto.start_time}`);
      if (start < now) {
        throw new BadRequestException("Cannot create past trip!");
      }
      const driverCheck = await client.query(
        `SELECT 1 FROM m_driver WHERE driver_id = $1 AND is_active = TRUE FOR UPDATE`,
        [dto.driver_id]
      );
      if (!driverCheck.rowCount) {
        throw new BadRequestException("Driver not found!");
      }
      const existingTrip = await client.query(
        `
        SELECT 1
        FROM t_guest_driver
        WHERE driver_id = $1
          AND is_active = TRUE
          AND trip_date = $2
          AND (
            (start_time <= $3 AND (drop_time IS NULL OR drop_time > $3))
            OR (drop_time IS NOT NULL AND drop_time > $3 AND start_time < $3)
          )
        FOR UPDATE
        `,
        [dto.driver_id, dto.trip_date, dto.start_time]
      );
      if (existingTrip.rowCount) {
        throw new BadRequestException("Driver may already have an active trip!");
      }
      const activeTrip = await client.query(`
        SELECT 1
        FROM t_guest_driver
        WHERE guest_id = $1
          AND is_active = TRUE
        LIMIT 1
      `, [dto.guest_id]);

      if (activeTrip.rowCount > 0) {
        throw new BadRequestException("Guest may already has an active trip!");
      }
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
        await this.activityLog.log({
          message: 'Driver Assigned to the guest',
          module: 'GUEST-DRIVER',
          action: 'CREATE',
          referenceId: trip.trip_id,
          performedBy: user,
          ipAddress: ip,
        }, client);
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
      if (!/^G\d+$/.test(dto.guest_id)) {
        throw new BadRequestException("Invalid guest ID!");
      }
      if (!/^D\d+$/.test(dto.driver_id)) {
        throw new BadRequestException("Invalid driver ID!");
      }
      if (!dto.trip_date || isNaN(Date.parse(dto.trip_date))) {
        throw new BadRequestException("Invalid trip date!");
      }
      if (dto.drop_date && isNaN(Date.parse(dto.drop_date))) {
        throw new BadRequestException("Invalid drop date!");
      }
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!dto.start_time || !timeRegex.test(dto.start_time)) {
        throw new BadRequestException("Invalid start time!");
      }
      if (dto.drop_time && !timeRegex.test(dto.drop_time)) {
        throw new BadRequestException("Invalid drop time!");
      }
      if (dto.drop_date && dto.drop_time) {
        const start = new Date(`${dto.trip_date}T${dto.start_time}`);
        const end = new Date(`${dto.drop_date}T${dto.drop_time}`);

        if (end <= start) {
          throw new BadRequestException("Invalid trip duration!");
        }
      }
      if (dto.pickup_location && dto.pickup_location.length > 255) {
        throw new BadRequestException("Pickup location is too long!");
      }
      if (dto.drop_location && dto.drop_location.length > 255) {
        throw new BadRequestException("Drop location is too long!");
      }
      const driverCheck = await client.query(
        `SELECT 1 FROM m_driver WHERE driver_id = $1 AND is_active = TRUE FOR UPDATE`,
        [dto.driver_id]
      );
      if (!driverCheck.rowCount) {
        throw new BadRequestException("Driver may not exist!");
      }
      const existingTrip = await client.query(
        `
        SELECT 1
        FROM t_guest_driver
        WHERE driver_id = $1
          AND is_active = TRUE
          AND trip_date = $2
          AND (
            (start_time <= $3 AND (drop_time IS NULL OR drop_time > $3))
            OR (drop_time IS NOT NULL AND drop_time > $3 AND start_time < $3)
          )
        FOR UPDATE
        `,
        [dto.driver_id, dto.trip_date, dto.start_time]
      );
      if (existingTrip.rowCount) {
        throw new BadRequestException("Driver may be assigned to another guest!");
      }
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
      await this.activityLog.log({
        message: 'Driver Assigned to the guest',
        module: 'GUEST-DRIVER',
        action: 'CREATE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    // });
  }
  async createTripStandalone(
    dto: CreateGuestDriverDto,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      if (!/^G\d+$/.test(dto.guest_id)) {
        throw new BadRequestException("Invalid guest ID!");
      }
      if (!/^D\d+$/.test(dto.driver_id)) {
        throw new BadRequestException("Invalid driver ID!");
      }
      if (!dto.trip_date || isNaN(Date.parse(dto.trip_date))) {
        throw new BadRequestException("Invalid trip date!");
      }
      if (dto.drop_date && isNaN(Date.parse(dto.drop_date))) {
        throw new BadRequestException("Invalid drop date!");
      }
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!dto.start_time || !timeRegex.test(dto.start_time)) {
        throw new BadRequestException("Invalid start time!");
      }
      if (dto.drop_time && !timeRegex.test(dto.drop_time)) {
        throw new BadRequestException("Invalid drop time!");
      }
      if (dto.drop_date && dto.drop_time) {
        const start = new Date(`${dto.trip_date}T${dto.start_time}`);
        const end = new Date(`${dto.drop_date}T${dto.drop_time}`);

        if (end <= start) {
          throw new BadRequestException("Invalid trip duration!");
        }
      }
      if (dto.pickup_location && dto.pickup_location.length > 255) {
        throw new BadRequestException("Pickup location is too long!");
      }
      if (dto.drop_location && dto.drop_location.length > 255) {
        throw new BadRequestException("Drop location is too long!");
      }
      const driverCheck = await client.query(
        `SELECT 1 FROM m_driver WHERE driver_id = $1 AND is_active = TRUE FOR UPDATE`,
        [dto.driver_id]
      );
      if (!driverCheck.rowCount) {
        throw new BadRequestException("Driver may not exist!");
      }
      const existingTrip = await client.query(
        `
        SELECT 1
        FROM t_guest_driver
        WHERE driver_id = $1
          AND is_active = TRUE
          AND trip_date = $2
          AND (
            (start_time <= $3 AND (drop_time IS NULL OR drop_time > $3))
            OR (drop_time IS NOT NULL AND drop_time > $3 AND start_time < $3)
          )
        FOR UPDATE
        `,
        [dto.driver_id, dto.trip_date, dto.start_time]
      );
      if (existingTrip.rowCount) {
        throw new BadRequestException("Driver is already assigned to a guest");
      }
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
      await this.activityLog.log({
        message: 'Driver Assigned to the guest',
        module: 'GUEST-DRIVER',
        action: 'CREATE',
        referenceId: dto.driver_id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return this.createTrip(client, dto, user, ip);
    });
  }

  async findActiveByGuest(guestId: string) {
    if (!/^G\d+$/.test(guestId)) {
      throw new BadRequestException("Invalid guest id");
    }
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
    if (!res.rows.length) {
      throw new BadRequestException("No trip found");
    }
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
    if (!/^GD\d+$/.test(id)) {
      throw new BadRequestException("Invalid trip id");
    }
    const sql = `SELECT * FROM t_guest_driver WHERE guest_driver_id = $1`;
    const res = await this.db.query(sql, [id]);
    if (!res.rows.length) {
      throw new BadRequestException("Trip not found");
    }
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
      await this.activityLog.log({
        message: 'Driver Assigned to the guest',
        module: 'GUEST-DRIVER',
        action: 'CREATE',
        referenceId: dto.driver_id,
        performedBy: user,
        ipAddress: ip,
      }, client);
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
    await this.activityLog.log({
        message: 'Guest trip expired! Driver unassigned',
        module: 'GUEST-DRIVER',
        action: 'UPDATE',
        referenceId: res.rows[0].guest_driver_id,
        performedBy: user,
        ipAddress: ip,
      }, client);
    return res.rows;
    });
  }
  async closeTrip(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^GD\d+$/.test(id)) {
        throw new BadRequestException("Invalid trip id");
      }
      const existing = await client.query(
        `SELECT 1 FROM t_guest_driver WHERE guest_driver_id = $1 FOR UPDATE`,
        [id]
      );

      if (!existing.rowCount) {
        throw new BadRequestException("Trip not found");
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
      await this.activityLog.log({
        message: 'Guest trip closed! Driver unassigned',
        module: 'GUEST-DRIVER',
        action: 'UPDATE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }

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
        if (!/^GD\d+$/.test(oldGuestDriverId)) {
          throw new BadRequestException("Invalid trip id");
        }
        if (dto.driver_id && !/^D\d+$/.test(dto.driver_id)) {
          throw new BadRequestException("Invalid driver id");
        }
        if (dto.guest_id && !/^G\d+$/.test(dto.guest_id)) {
          throw new BadRequestException("Invalid guest id");
        }
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
      await this.activityLog.log({
        message: 'Guest trip revised!',
        module: 'GUEST-DRIVER',
        action: 'UPDATE',
        referenceId: oldGuestDriverId,
        performedBy: user,
        ipAddress: ip,
      }, client);
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
      if (isNaN(Date.parse(tripDate))) {
        throw new BadRequestException("Invalid trip date");
      }
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(startTime)) {
        throw new BadRequestException("Invalid start time");
      }
      if (dropTime && !timeRegex.test(dropTime)) {
        throw new BadRequestException("Invalid drop time");
      }
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
        throw new BadRequestException("Driver is already assigned to a guest");
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
    if (isNaN(Date.parse(tripDate))) {
      throw new BadRequestException("Invalid trip date");
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime)) {
      throw new BadRequestException("Invalid start time");
    }
    if (dropTime && !timeRegex.test(dropTime)) {
      throw new BadRequestException("Invalid drop time");
    }
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
        throw new BadRequestException("Driver is not on duty");
      }
    // });
  }
  private async assertDriverNotOnWeekOff(
    client: any,
    driverId: string,
    tripDate: string
  ) {
    // return this.db.transaction(async (client) => {
    if (isNaN(Date.parse(tripDate))) {
      throw new BadRequestException("Invalid trip date");
    }
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
        throw new BadRequestException("Driver has a week off");
      }
    // });
  }
}