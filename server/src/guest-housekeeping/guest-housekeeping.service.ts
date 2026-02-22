import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestHousekeepingDto } from "./dto/create-guest-housekeeping.dto";
import { UpdateGuestHousekeepingDto } from "./dto/update-guest-housekeeping.dto";

@Injectable()
export class GuestHousekeepingService {
  constructor(private readonly db: DatabaseService) {}

  private async generateId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'GHK' || LPAD(nextval('guest_housekeeping_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  async findAll(activeOnly = true) {
  const sql = activeOnly
    ? `SELECT * FROM t_room_housekeeping WHERE status != 'Cancelled' ORDER BY task_date DESC`
    : `SELECT * FROM t_room_housekeeping ORDER BY task_date DESC`;

  const res = await this.db.query(sql);
  return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_room_housekeeping WHERE guest_hk_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestHousekeepingDto, user: string, ip: string) {
    // 1️⃣ Find active guest for this room
    return this.db.transaction(async (client) => {
      try {
        const guestRes = await client.query(
          `
          SELECT guest_id
          FROM t_guest_room
          WHERE room_id = $1
            AND is_active = TRUE
          FOR UPDATE
          `,
          [dto.room_id]
        );
        
        if (!guestRes.rowCount) {
          throw new BadRequestException('No active guest found for this room');
        }
        const guestId = guestRes.rows[0].guest_id;

        if (dto.task_date) {
          const now = new Date();
          const taskDate = new Date(dto.task_date);

          if (
            taskDate.toDateString() === now.toDateString()
          ) {
            const hour = now.getHours();

            if (dto.task_shift === 'Morning' && hour >= 11) {
              throw new BadRequestException(
                'Morning shift cannot be assigned this late'
              );
            }
          }
        }
        // await this.db.query(`LOCK TABLE t_room_housekeeping IN EXCLUSIVE MODE`);
        const id = await this.generateId(client);
        // const nowISO = new Date().toISOString();
        const sql = `
          INSERT INTO t_room_housekeeping (
            guest_hk_id,
            hk_id,
            room_id,
            guest_id,           -- ✅ ADD THIS
            task_date,
            task_shift,
            admin_instructions,
            is_active,            -- ✅ ADD THIS
            inserted_at,
            inserted_by,
            inserted_ip
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,True,NOW(),$8,$9
          )
          RETURNING *;
        `;
        const params = [
          id,
          dto.hk_id,
          dto.room_id,
          guestId,                 // ✅ ADD
          dto.task_date,
          dto.task_shift,
          dto.admin_instructions ?? null,
          user,
          ip
        ];
        const res = await client.query(sql, params);
        return res.rows[0];
      } catch (error) {
        throw error;
      }
    });
  }

  async update(id: string, dto: UpdateGuestHousekeepingDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      try {
      const existingRes = await client.query(
        `SELECT * FROM t_room_housekeeping WHERE guest_hk_id = $1 FOR UPDATE`,
        [id]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Housekeeping task '${id}' not found`);
      }

      const existing = existingRes.rows[0];
      // if (!existing) throw new NotFoundException(`Housekeeping task '${id}' not found`);

      // const now = new Date().toISOString();

      const sql = `
        UPDATE t_room_housekeeping SET
          hk_id = $1,
          room_id = $2,
          task_date = $3,
          task_shift = $4,
          admin_instructions = $5,
          status = $6,
          updated_at = NOW(),
          updated_by = $7,
          updated_ip = $8
        WHERE guest_hk_id = $9
        RETURNING *;
      `;

      const params = [
        dto.hk_id ?? existing.hk_id,
        dto.room_id ?? existing.room_id,
        dto.task_date ?? existing.task_date,
        dto.task_shift ?? existing.task_shift,
        dto.admin_instructions ?? existing.admin_instructions,
        dto.status ?? existing.status,
        user,
        ip,
        id,
      ];

      const res = await client.query(sql, params);
      return res.rows[0];
      } catch (error) {
        throw error;
      }
    });
  }

  async cancel(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      try {
      // 1️⃣ Fetch housekeeping task
      const check = await client.query(
        `
        SELECT guest_id, is_active
        FROM t_room_housekeeping
        WHERE guest_hk_id = $1
        FOR UPDATE
        `,
        [id]
      );

      if (!check.rowCount) {
        throw new NotFoundException('Housekeeping task not found');
      }

      const hk = check.rows[0];

      // 2️⃣ BLOCK if assigned to guest
      if (hk.is_active && hk.guest_id) {
        throw new BadRequestException(
          'Cannot delete housekeeping: it is assigned to an active guest'
        );
      }

      // 3️⃣ Safe to cancel
      const sql = `
        UPDATE t_room_housekeeping
        SET
          status = 'Cancelled',
          is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2,
          updated_ip = $3
        WHERE guest_hk_id = $1
        RETURNING *;
      `;

      const res = await client.query(sql, [id, user, ip]);
      return res.rows[0];
      } catch (error) {
        throw error;
      }
    });
  }
}
