import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateHousekeepingDto } from './dto/create-housekeeping.dto';
import { UpdateHousekeepingDto } from './dto/update-housekeeping.dto';
import { transliterateToDevanagari } from '../../common/utlis/transliteration.util';

@Injectable()
export class HousekeepingService {
  constructor(private readonly db: DatabaseService) {}

  // private async generateId(): Promise<string> {
  //   const sql = `SELECT hk_id FROM m_housekeeping ORDER BY hk_id DESC LIMIT 1`;
  //   const res = await this.db.query(sql);

  //   if (res.rows.length === 0) return "HK001";

  //   const last = res.rows[0].hk_id.replace("HK", "");
  //   const next = (parseInt(last) + 1).toString().padStart(3, "0");
  //   return "HK" + next;
  // }
  private async generateId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'HK' || LPAD(nextval('housekeeping_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  async findAll({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  }: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const SORT_MAP: Record<string, string> = {
      hk_name: 'hk_name',
      shift: 'shift',
      hk_contact: 'hk_contact',
    };

    const sortColumn = SORT_MAP[sortBy] ?? 'hk_name';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;

    if (search) {
      const countSql = `
        SELECT COUNT(*)::int AS count
        FROM m_housekeeping
        WHERE is_active = true
          AND (
            hk_name ILIKE $1
            OR hk_contact ILIKE $1
          )
      `;

      const dataSql = `
        SELECT *
        FROM m_housekeeping
        WHERE is_active = true
          AND (
            hk_name ILIKE $1
            OR hk_contact ILIKE $1
          )
        ORDER BY ${sortColumn} ${order}
        LIMIT $2::int OFFSET $3::int
      `;

      const [{ count }] = (
        await this.db.query(countSql, [`%${search}%`])
      ).rows;

      const { rows } = await this.db.query(dataSql, [
        `%${search}%`,
        limit,
        offset,
      ]);

      return { data: rows, totalCount: count };
    }

    // no search
    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM m_housekeeping
      WHERE is_active = true
    `;

    const dataSql = `
      SELECT *
      FROM m_housekeeping
      WHERE is_active = true
      ORDER BY ${sortColumn} ${order}
      LIMIT $1::int OFFSET $2::int
    `;

    const [{ count }] = (await this.db.query(countSql)).rows;
    const { rows } = await this.db.query(dataSql, [limit, offset]);

    return { data: rows, totalCount: count };
  }

  async findOneByName(name: string) {
    const sql = `SELECT * FROM m_housekeeping WHERE hk_name = $1`;
    const res = await this.db.query(sql, [name]);
    return res.rows[0];
  }
  async findOneById(hkId: string) {
    const res = await this.db.query(
      `SELECT * FROM m_housekeeping WHERE hk_id = $1`,
      [hkId]
    );
    return res.rows[0];
  }

  async create(dto: CreateHousekeepingDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      // 1️⃣ Prevent duplicate housekeeping name (case-insensitive)
      const existingByName = await client.query(
        `
        SELECT 1
        FROM m_housekeeping
        WHERE LOWER(hk_name) = LOWER($1)
          AND is_active = TRUE
        LIMIT 1
        `,
        [dto.hk_name.trim()]
      );

      if (existingByName.rowCount > 0) {
        throw new BadRequestException(
          `Housekeeping staff '${dto.hk_name}' already exists`
        );
      }

      // 2️⃣ Prevent duplicate contact number
      const existingByContact = await client.query(
        `
        SELECT 1
        FROM m_housekeeping
        WHERE hk_contact = $1
          AND is_active = TRUE
        LIMIT 1
        `,
        [dto.hk_contact]
      );

      if (existingByContact.rowCount > 0) {
        throw new BadRequestException(
          `Contact number '${dto.hk_contact}' is already assigned to another staff`
        );
      }
      if (
        dto.hk_alternate_contact &&
        dto.hk_contact === dto.hk_alternate_contact
      ) {
        throw new BadRequestException(
          'Primary contact and alternate contact cannot be the same'
        );
      }
      const hk_id = await this.generateId(client);
      const hk_name_local_language = transliterateToDevanagari(dto.hk_name);

      // const now = new Date().toISOString();

      const sql = `
        INSERT INTO m_housekeeping (
          hk_id, hk_name, hk_name_local_language,
          hk_contact, hk_alternate_contact,
          address, shift,
          is_active,
          inserted_at, inserted_by, inserted_ip,
          updated_at, updated_by, updated_ip
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),$8,$9,NULL,NULL,NULL)
        RETURNING *;
      `;

      const params = [
        hk_id,
        dto.hk_name,
        hk_name_local_language,
        dto.hk_contact,
        dto.hk_alternate_contact ?? null,
        dto.address ?? null,
        dto.shift,
        user,
        ip,
      ];

      const res = await client.query(sql, params);
      return res.rows[0];
    });
  }
  async update(hkId: string, dto: UpdateHousekeepingDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `
        SELECT *
        FROM m_housekeeping
        WHERE hk_id = $1
        FOR UPDATE
        `,
        [hkId]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Housekeeping '${hkId}' not found`);
      }

      const existing = existingRes.rows[0];

      // 🔹 Name conflict check
      if (dto.hk_name && dto.hk_name !== existing.hk_name) {
        const nameConflict = await client.query(
          `
          SELECT 1
          FROM m_housekeeping
          WHERE LOWER(hk_name) = LOWER($1)
            AND hk_id <> $2
            AND is_active = TRUE
          LIMIT 1
          `,
          [dto.hk_name.trim(), hkId]
        );

        if (nameConflict.rowCount > 0) {
          throw new BadRequestException(
            `Housekeeping staff name '${dto.hk_name}' already exists`
          );
        }
      }

      // 🔹 Assignment check
      const activeAssignment = await client.query(
        `
        SELECT 1
        FROM t_room_housekeeping
        WHERE hk_id = $1
          AND is_active = TRUE
        FOR UPDATE
        `,
        [hkId]
      );

      if (dto.is_active === false && activeAssignment.rowCount > 0) {
        throw new BadRequestException(
          'Cannot deactivate housekeeping staff while assigned to a room'
        );
      }

      if (dto.shift && dto.shift !== existing.shift && activeAssignment.rowCount > 0) {
        throw new BadRequestException(
          'Cannot change shift while staff is assigned to a room'
        );
      }

      const primaryContact = dto.hk_contact ?? existing.hk_contact;
      const alternateContact = dto.hk_alternate_contact ?? existing.hk_alternate_contact;

      if (alternateContact && primaryContact === alternateContact) {
        throw new BadRequestException(
          'Primary contact and alternate contact cannot be the same'
        );
      }

      if (dto.hk_contact && dto.hk_contact !== existing.hk_contact) {
        const contactConflict = await client.query(
          `
          SELECT 1
          FROM m_housekeeping
          WHERE hk_contact = $1
            AND hk_id <> $2
            AND is_active = TRUE
          LIMIT 1
          `,
          [dto.hk_contact, hkId]
        );

        if (contactConflict.rowCount > 0) {
          throw new BadRequestException(
            `Contact number '${dto.hk_contact}' already exists`
          );
        }
      }

      const VALID_SHIFTS = ['Morning', 'Evening', 'Night', 'Full-Day'];

      if (dto.shift && !VALID_SHIFTS.includes(dto.shift)) {
        throw new BadRequestException('Invalid shift value');
      }

      const cleanedName = dto.hk_name?.trim() ?? existing.hk_name;
      const hk_name_local_language = transliterateToDevanagari(cleanedName);

      const res = await client.query(
        `
        UPDATE m_housekeeping SET
          hk_name = $1,
          hk_name_local_language = $2,
          hk_contact = $3,
          hk_alternate_contact = $4,
          address = $5,
          shift = $6,
          is_active = $7,
          updated_at = NOW(),
          updated_by = $8,
          updated_ip = $9
        WHERE hk_id = $10
        RETURNING *;
        `,
        [
          dto.hk_name ?? existing.hk_name,
          hk_name_local_language,
          dto.hk_contact ?? existing.hk_contact,
          dto.hk_alternate_contact ?? existing.hk_alternate_contact,
          dto.address ?? existing.address,
          dto.shift ?? existing.shift,
          dto.is_active ?? existing.is_active,
          user,
          ip,
          hkId,
        ]
      );

      return res.rows[0];
    });
  }
  async softDelete(hkId: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `
        SELECT *
        FROM m_housekeeping
        WHERE hk_id = $1
        FOR UPDATE
        `,
        [hkId]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Housekeeping '${hkId}' not found`);
      }

      const assigned = await client.query(
        `
        SELECT 1
        FROM t_room_housekeeping
        WHERE hk_id = $1
          AND is_active = TRUE
        FOR UPDATE
        `,
        [hkId]
      );

      if (assigned.rowCount > 0) {
        throw new BadRequestException(
          `Cannot delete staff '${hkId}' because assigned to a room`
        );
      }

      const res = await client.query(
        `
        UPDATE m_housekeeping
        SET is_active = false,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE hk_id = $3
        RETURNING *;
        `,
        [user, ip, hkId]
      );

      return res.rows[0];
    });
  }

  // async update(hkId: string, dto: UpdateHousekeepingDto, user: string, ip: string) {
  //   return this.db.transaction(async (client) => {
  //     const existingRes = await client.query(
  //       `
  //       SELECT *
  //       FROM m_housekeeping
  //       WHERE hk_id = $1
  //       FOR UPDATE
  //       `,
  //       [hkId]
  //     );

  //     if (!existingRes.rowCount) {
  //       throw new NotFoundException(`Housekeeping '${dto.hk_name}' not found`);
  //     }

  //     const existing = existingRes.rows[0];
  //     // 1️⃣ Prevent renaming to an existing active staff
  //     if (dto.hk_name && dto.hk_name !== existing.hk_name) {
  //       const nameConflict = await this.db.query(
  //         `
  //         SELECT 1
  //         FROM m_housekeeping
  //         WHERE LOWER(hk_name) = LOWER($1)
  //           AND hk_id <> $2
  //           AND is_active = TRUE
  //         LIMIT 1
  //         `,
  //         [dto.hk_name.trim(), existing.hk_id]
  //       );

  //       if (nameConflict.rowCount > 0) {
  //         throw new BadRequestException(
  //           `Housekeeping staff name '${dto.hk_name}' already exists`
  //         );
  //       }
  //     }

  //     // 2️⃣ Check if staff is currently assigned to any room
  //     const activeAssignment = await this.db.query(
  //       `
  //       SELECT 1
  //       FROM t_room_housekeeping
  //       WHERE hk_id = $1
  //         AND is_active = TRUE
  //       LIMIT 1
  //       `,
  //       [existing.hk_id]
  //     );
  //     // 3️⃣ Block deactivation if assigned
  //     if (dto.is_active === false && activeAssignment.rowCount > 0) {
  //       throw new BadRequestException(
  //         'Cannot deactivate housekeeping staff while assigned to a room'
  //       );
  //     }

  //     // 4️⃣ Block shift change if assigned
  //     if (dto.shift && dto.shift !== existing.shift && activeAssignment.rowCount > 0) {
  //       throw new BadRequestException(
  //         'Cannot change shift while staff is assigned to a room'
  //       );
  //     }
  //     const primaryContact = dto.hk_contact ?? existing.hk_contact;
  //     const alternateContact = dto.hk_alternate_contact ?? existing.hk_alternate_contact;

  //     if (alternateContact && primaryContact === alternateContact) {
  //       throw new BadRequestException(
  //         'Primary contact and alternate contact cannot be the same'
  //       );
  //     }
  //     if (dto.hk_contact && dto.hk_contact !== existing.hk_contact) {
  //       const contactConflict = await this.db.query(
  //         `
  //         SELECT 1
  //         FROM m_housekeeping
  //         WHERE hk_contact = $1
  //           AND hk_id <> $2
  //           AND is_active = TRUE
  //         LIMIT 1
  //         `,
  //         [dto.hk_contact, existing.hk_id]
  //       );

  //       if (contactConflict.rowCount > 0) {
  //         throw new BadRequestException(
  //           `Contact number '${dto.hk_contact}' is already assigned to another staff`
  //         );
  //       }
  //     }
  //     const VALID_SHIFTS = ['Morning', 'Evening', 'Night', 'Full-Day'];

  //     if (dto.shift && !VALID_SHIFTS.includes(dto.shift)) {
  //       throw new BadRequestException('Invalid shift value');
  //     }
  //     const hk_name_local_language = transliterateToDevanagari(dto.hk_name);

  //     const now = new Date().toISOString();

  //     const sql = `
  //       UPDATE m_housekeeping SET
  //         hk_name = $1,
  //         hk_name_local_language = $2,
  //         hk_contact = $3,
  //         hk_alternate_contact = $4,
  //         address = $5,
  //         shift = $6,
  //         is_active = $7,
  //         updated_at = $8,
  //         updated_by = $9,
  //         updated_ip = $10
  //       WHERE hk_id = $11
  //       RETURNING *;
  //     `;

  //     const params = [
  //       dto.hk_name ?? existing.hk_name,
  //       hk_name_local_language,
  //       dto.hk_contact ?? existing.hk_contact,
  //       dto.hk_alternate_contact ?? existing.hk_alternate_contact,
  //       dto.address ?? existing.address,
  //       dto.shift ?? existing.shift,
  //       dto.is_active ?? existing.is_active,
  //       now,
  //       user,
  //       ip,
  //       existing.hk_id,
  //     ];

  //     const res = await this.db.query(sql, params);
  //     return res.rows[0];
  //   });
  // }

  // async softDelete(hkId: string, user: string, ip: string) {
  //   return this.db.transaction(async (client) => {

  //     const existingRes = await client.query(
  //       `
  //       SELECT *
  //       FROM m_housekeeping
  //       WHERE hk_id = $1
  //       FOR UPDATE
  //       `,
  //       [hkId]
  //     );

  //     if (!existingRes.rowCount) {
  //       throw new BadRequestException(`Room boy not found`);
  //     }

  //     const existing = existingRes.rows[0];

  //     const assigned = await client.query(
  //       `
  //       SELECT 1
  //       FROM t_room_housekeeping
  //       WHERE hk_id = $1
  //         AND is_active = TRUE
  //       FOR UPDATE
  //       `,
  //       [existing.hk_id]
  //     );

  //     if (assigned.rowCount > 0) {
  //       throw new BadRequestException(
  //         `Cannot delete staff '${name}' because assigned to a room`
  //       );
  //     }

  //     const now = new Date().toISOString();

  //     const res = await client.query(
  //       `
  //       UPDATE m_housekeeping
  //       SET is_active = false,
  //           updated_at = $1,
  //           updated_by = $2,
  //           updated_ip = $3
  //       WHERE hk_id = $4
  //       RETURNING *;
  //       `,
  //       [now, user, ip, existing.hk_id]
  //     );

  //     return res.rows[0];
  //   });
  // }

  // async softDelete(name: string, user: string, ip: string) {
  //   const existing = await this.findOneByName(name);
  //   if (!existing) {
  //     throw new BadRequestException(`Room boy '${name}' not found`);
  //   }

  //   // 🔴 BLOCK DELETE IF ASSIGNED
  //   const assigned = await this.db.query(
  //     `
  //     SELECT 1
  //     FROM t_room_housekeeping
  //     WHERE hk_id = $1
  //       AND is_active = TRUE
  //     LIMIT 1
  //     `,
  //     [existing.hk_id]
  //   );

  //   if (assigned.rowCount > 0) {
  //     throw new BadRequestException(
  //       `Cannot delete housekeeping staff '${name}' because they are currently assigned to a room`
  //     );
  //   }
  //   // ✅ SAFE TO DELETE
  //   const now = new Date().toISOString();

  //   const sql = `
  //     UPDATE m_housekeeping
  //     SET is_active = false,
  //         updated_at = $1,
  //         updated_by = $2,
  //         updated_ip = $3
  //     WHERE hk_id = $4
  //     RETURNING *;
  //   `;

  //   const res = await this.db.query(sql, [now, user, ip, existing.hk_id]);
  //   return res.rows[0];
  // }
}
