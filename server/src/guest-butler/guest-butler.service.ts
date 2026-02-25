import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestButlerDto } from "./dto/create-guest-butler.dto";
import { UpdateGuestButlerDto } from "./dto/update-guest-butler.dto";
import { ActivityLogService } from "src/activity-log/activity-log.service";
@Injectable()
export class GuestButlerService {
  constructor(private readonly db: DatabaseService, private readonly activityLog: ActivityLogService) {}
  private async generateId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'GB' || LPAD(nextval('guest_butler_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  async findAll(activeOnly = true) {
    if (typeof activeOnly !== 'boolean') {
      throw new BadRequestException('Invalid activeOnly flag');
    }
    const sql = `
      SELECT
        gb.guest_butler_id,
        gb.guest_id,
        gb.room_id,
        gb.special_request,
        gb.is_active,
        gb.inserted_at,

        b.butler_id,
        s.full_name AS butler_name,
        s.primary_mobile AS butler_mobile,
        b.shift

      FROM t_guest_butler gb
      JOIN m_butler b ON b.butler_id = gb.butler_id
      JOIN m_staff s ON s.staff_id = b.staff_id
      WHERE ($1::boolean IS FALSE OR gb.is_active = TRUE)
      ORDER BY gb.inserted_at DESC
    `;

    const res = await this.db.query(sql, [activeOnly]);
    return res.rows;
  }

  async findOne(id: string) {
    if (!/^GB\d+$/.test(id)) {
      throw new BadRequestException('Invalid Guest-Butler ID format');
    }
    const sql = `
      SELECT
        gb.*,
        b.butler_id,
        s.full_name AS butler_name,
        s.primary_mobile AS butler_mobile,
        b.shift
      FROM t_guest_butler gb
      JOIN m_butler b ON b.butler_id = gb.butler_id
      JOIN m_staff s ON s.staff_id = b.staff_id
      WHERE gb.guest_butler_id = $1
    `;
    const res = await this.db.query(sql, [id]);
    if (!res.rowCount) {
      throw new NotFoundException(`Guest-Butler assignment '${id}' not found`);
    }
    return res.rows[0];
  }

  async create(dto: CreateGuestButlerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      // 🔒 Validate guest exists
      const guestCheck = await client.query(
        `SELECT 1 
        FROM m_guest 
        WHERE guest_id = $1 AND is_active = TRUE
        FOR UPDATE`,
        [dto.guest_id]
      );

      if (!guestCheck.rowCount) {
        throw new NotFoundException("Guest not found or inactive");
      }
      if (!/^G\d+$/.test(dto.guest_id)) {
        throw new BadRequestException('Invalid guest ID format');
      }
      // if (!/^B\d+$/.test(dto.butler_id)) {
      //   throw new BadRequestException('Invalid butler ID format');
      // }
      // if (dto.room_id && !/^R\d+$/.test(dto.room_id)) {
      //   throw new BadRequestException('Invalid room ID format');
      // }
      if (dto.specialRequest && dto.specialRequest.length > 255) {
        throw new BadRequestException('Special request cannot exceed 255 characters');
      }
      const stayCheck = await client.query(`
        SELECT 1 FROM t_guest_inout
        WHERE guest_id = $1
          AND is_active = TRUE
          AND status = 'Entered'
        LIMIT 1
      `, [dto.guest_id]);

      if (!stayCheck.rowCount) {
        throw new BadRequestException('Guest is not currently active inside');
      }
      const duplicatePair = await client.query(`
        SELECT 1 FROM t_guest_butler
        WHERE guest_id = $1
          AND butler_id = $2
          AND is_active = TRUE
      `, [dto.guest_id, dto.butler_id]);

      if (duplicatePair.rowCount > 0) {
        throw new BadRequestException('This butler is already assigned to this guest');
      }
      if (dto.room_id) {
        const roomCheck = await client.query(`
          SELECT 1 FROM t_guest_room
          WHERE guest_id = $1
            AND room_id = $2
            AND is_active = TRUE
        `, [dto.guest_id, dto.room_id]);

        if (!roomCheck.rowCount) {
          throw new BadRequestException('Room does not belong to this guest');
        }
      }
      // 🔒 Validate butler exists AND staff active
      const butlerCheck = await client.query(
        `
        SELECT 1
        FROM m_butler b
        JOIN m_staff s ON s.staff_id = b.staff_id
        WHERE b.butler_id = $1
          AND b.is_active = TRUE
          AND s.is_active = TRUE
        FOR UPDATE
        `,
        [dto.butler_id]
      );

      if (!butlerCheck.rowCount) {
        throw new NotFoundException("Butler not found or inactive");
      }

    // 🔒 Lock butler assignments
    await client.query(
      `SELECT 1 FROM t_guest_butler WHERE butler_id = $1 AND is_active = TRUE FOR UPDATE`,
      [dto.butler_id]
    );

    // 🔒 Lock guest assignments
    await client.query(
      `SELECT 1 FROM t_guest_butler WHERE guest_id = $1 AND is_active = TRUE  FOR UPDATE`,
      [dto.guest_id]
    );
      const existingSql = `
        SELECT guest_butler_id
        FROM t_guest_butler
        WHERE guest_id = $1
          AND is_active = TRUE
      `;
      const existingRes = await client.query(existingSql, [dto.guest_id]);

      if (existingRes.rows.length > 0) {
        throw new BadRequestException(
          "This guest already has a butler assigned"
        );
      }

      // 🔒 ENFORCE BUTLER CAPACITY (MAX 3)
      const countSql = `
        SELECT COUNT(*) AS count FROM t_guest_butler
        WHERE butler_id = $1 AND is_active = TRUE
      `;
      const countRes = await client.query(countSql, [dto.butler_id]);

      if (Number(countRes.rows[0].count) >= 3) {
        throw new BadRequestException(
          "Butler already assigned to 3 active guests"
        );
      }
      const id = await this.generateId(client);
      const sql = `
        INSERT INTO t_guest_butler (
          guest_butler_id,
          guest_id,
          butler_id,
          room_id,
          special_request,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,TRUE,NOW(),$6,$7)
        RETURNING *;
      `;

      const params = [
        id,
        dto.guest_id,
        dto.butler_id,
        dto.room_id ?? null,
        dto.specialRequest ?? null,
        user,
        ip,
      ];
      const res = await client.query(sql, params);
      await this.activityLog.log({
        message: 'Butler assigned to guest',
        module: 'GUEST-BUTLER',
        action: 'CREATE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }

  // async create(dto: CreateGuestButlerDto, user: string, ip: string) {
  //   const id = await this.generateId();
  //   const now = new Date().toISOString();

  //   const sql = `
  //     INSERT INTO t_guest_butler(
  //       guest_butler_id,
  //       guest_id, butler_id, room_id,

  //       specialRequest,

  //       is_active,
  //       inserted_at, inserted_by, inserted_ip
  //     )
  //     VALUES (
  //       $1, $2, $3, $4,
  //       $5,
  //       true,
  //       $6, $7, $8
  //     )
  //     RETURNING *;
  //   `;

  //   const params = [
  //     id,

  //     dto.guest_id,
  //     dto.butler_id,
  //     dto.room_id ?? null,

  //     // dto.check_in_date ?? null,
  //     // dto.check_in_time ?? null,
  //     // dto.check_out_date ?? null,
  //     // dto.check_out_time ?? null,

  //     // dto.service_type,
  //     // dto.service_description ?? null,

  //     // dto.service_date ?? null,
  //     // dto.service_time ?? null,

  //     dto.specialRequest ?? null,

  //     now,
  //     user,
  //     ip
  //   ];

  //   const res = await this.db.query(sql, params);
  //   return res.rows[0];
  // }

  // async update(id: string, dto: UpdateGuestButlerDto, user: string, ip: string) {
  //   const existing = await this.findOne(id);
  //   if (!existing) throw new Error(`Guest Butler Entry '${id}' not found`);

  //   const now = new Date().toISOString();

  //   const sql = `
  //     UPDATE t_guest_butler SET
  //       guest_id = $1,
  //       butler_id = $2,
  //       room_id = $3,

  //       specialRequest = $4,
  //       is_active = $5,

  //       updated_at = $6,
  //       updated_by = $7,
  //       updated_ip = $8
  //     WHERE guest_butler_id = $9
  //     RETURNING *;
  //   `;

  //   const params = [
  //     dto.guest_id ?? existing.guest_id,
  //     dto.butler_id ?? existing.butler_id,
  //     dto.room_id ?? existing.room_id,

  //     // dto.check_in_date ?? existing.check_in_date,
  //     // dto.check_in_time ?? existing.check_in_time,
  //     // dto.check_out_date ?? existing.check_out_date,
  //     // dto.check_out_time ?? existing.check_out_time,

  //     // dto.service_type ?? existing.service_type,
  //     // dto.service_description ?? existing.service_description,

  //     // dto.service_date ?? existing.service_date,
  //     // dto.service_time ?? existing.service_time,

  //     dto.specialRequest ?? existing.remarks,
  //     dto.is_active ?? existing.is_active,

  //     now,
  //     user,
  //     ip,

  //     id
  //   ];

  //   const res = await this.db.query(sql, params);
  //   return res.rows[0];
  // }
  async update(id: string, dto: UpdateGuestButlerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^GB\d+$/.test(id)) {
        throw new BadRequestException('Invalid Guest-Butler ID format');
      }
      if (dto.specialRequest && dto.specialRequest.length > 255) {
        throw new BadRequestException('Special request cannot exceed 255 characters');
      }
      const existingRes = await client.query(
        `SELECT *
        FROM t_guest_butler
        WHERE guest_butler_id = $1
          AND is_active = TRUE
        FOR UPDATE`,
        [id]
      );
      const existing = existingRes.rows[0];
      if (!existing) {
        throw new NotFoundException(`Guest-Butler assignment '${id}' not found`);
      }
      const sql = `
        UPDATE t_guest_butler
        SET
          special_request = $1,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
        WHERE guest_butler_id = $4
        RETURNING *;
      `;

      const params = [
        dto.specialRequest ?? existing.special_request,
        user,
        ip,
        id,
      ];

      const res = await client.query(sql, params);
      await this.activityLog.log({
        message: 'Butler assignment updated',
        module: 'GUEST-BUTLER',
        action: 'UPDATE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }

  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^GB\d+$/.test(id)) {
        throw new BadRequestException('Invalid Guest-Butler ID format');
      }
      const existingRes = await client.query(
        `SELECT *
          FROM t_guest_butler
          WHERE guest_butler_id = $1
            AND is_active = TRUE
          FOR UPDATE`,
        [id]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Assignment '${id}' not found`);
      }
      const hasRequests = await client.query(`
        SELECT 1 FROM t_guest_butler
        WHERE guest_butler_id = $1
          AND special_request IS NOT NULL
          AND TRIM(special_request) <> ''
      `, [id]);

      if (hasRequests.rowCount > 0) {
        throw new BadRequestException('Cannot remove butler with pending special requests');
      }
      const sql = `
        UPDATE t_guest_butler SET 
          is_active = false,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE guest_butler_id = $3
        RETURNING *;
      `;
      const res = await client.query(sql, [user, ip, id]);
      await this.activityLog.log({
        message: 'Butler assignment deleted',
        module: 'GUEST-BUTLER',
        action: 'DELETE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }
}
