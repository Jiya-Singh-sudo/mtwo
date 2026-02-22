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
      ? `SELECT * FROM t_guest_hk WHERE status != 'Cancelled' ORDER BY inserted_at DESC`
      : `SELECT * FROM t_guest_hk ORDER BY inserted_at DESC`;

    const res = await this.db.query(sql);
    return res.rows;
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT * FROM t_guest_hk WHERE guest_hk_id = $1`,
      [id]
    );

    if (!res.rowCount) {
      throw new NotFoundException('Housekeeping task not found');
    }

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
          throw new BadRequestException('No active guest assigned to this room');
        }
        const guestId = guestRes.rows[0].guest_id;

    // 2️⃣ Ensure guest has active stay
    const stayRes = await client.query(
      `
      SELECT entry_date, exit_date
      FROM t_guest_inout
      WHERE guest_id = $1
        AND is_active = TRUE
      `,
      [guestId]
    );

    if (!stayRes.rowCount) {
      throw new BadRequestException(
        'Guest does not have an active stay'
      );
    }

    // 3️⃣ Prevent duplicate housekeeping assignment
    const existingHk = await client.query(
      `
      SELECT 1
      FROM t_guest_hk
      WHERE guest_id = $1
        AND is_active = TRUE
      `,
      [guestId]
    );

    if (existingHk.rowCount) {
      throw new BadRequestException(
        'Housekeeping already assigned to this guest'
      );
    }
        const id = await this.generateId(client);
        // const nowISO = new Date().toISOString();
        const sql = `
          INSERT INTO t_guest_hk (
            guest_hk_id,
            guest_id,
            hk_id,
            status,
            remarks,
            is_active,
            inserted_at,
            inserted_by,
            inserted_ip
          )
          VALUES ($1,$2,$3,'Assigned',$4,TRUE,NOW(),$5,$6)
          RETURNING *;
        `;

        const params = [
          id,
          guestId,
          dto.hk_id,
          dto.remarks ?? null,
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
        `SELECT * FROM t_guest_hk WHERE guest_hk_id = $1 FOR UPDATE`,
        [id]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Housekeeping task '${id}' not found`);
      }

      const existing = existingRes.rows[0];
      const sql = `
        UPDATE t_guest_hk SET
          hk_id = $1,
          status = $2,
          remarks= $3,
          updated_at = NOW(),
          updated_by = $4,
          updated_ip = $5
        WHERE guest_hk_id = $6
        RETURNING *;
      `;
      const params = [
        dto.hk_id ?? existing.hk_id,
        dto.status ?? existing.status,
        dto.remarks ?? existing.remarks,
        user,
        ip,
        id
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
      `SELECT * FROM t_guest_hk WHERE guest_hk_id = $1 FOR UPDATE`,
      [id]
    );
      if (!check.rowCount) {
        throw new NotFoundException('Housekeeping task not found');
      }
      // const hk = check.rows[0];

      // // 2️⃣ BLOCK if assigned to guest
      // if (hk.is_active && hk.guest_id) {
      //   throw new BadRequestException(
      //     'Cannot delete housekeeping: it is assigned to an active guest'
      //   );
      // }
      const sql = `
        UPDATE t_guest_hk
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
