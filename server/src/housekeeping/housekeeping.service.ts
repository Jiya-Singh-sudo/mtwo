import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateHousekeepingDto } from './dto/create-housekeeping.dto';
import { UpdateHousekeepingDto } from './dto/update-housekeeping.dto';
import { transliterateToDevanagari } from '../../common/utlis/transliteration.util';

@Injectable()
export class HousekeepingService {
  constructor(private readonly db: DatabaseService) { }

  private async generateId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'HK' || LPAD(nextval('housekeeping_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  private async generateStaffId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'S' || LPAD(nextval('staff_seq')::text,3,'0') AS id
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
      hk_name: 's.full_name',
      shift: 'hk.shift',
      hk_contact: 's.primary_mobile',
    };

    const sortColumn = SORT_MAP[sortBy] ?? 's.full_name';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;

    const selectCols = `
      hk.hk_id,
      s.full_name AS hk_name,
      s.full_name_local_language,
      s.primary_mobile AS hk_contact,
      s.alternate_mobile AS hk_alternate_contact,
      s.address,
      hk.shift,
      hk.is_active
    `;

    const fromJoin = `
      FROM m_housekeeping hk
      JOIN m_staff s ON s.staff_id = hk.staff_id
    `;

    if (search) {
      const countSql = `
        SELECT COUNT(*)::int AS count
        ${fromJoin}
        WHERE hk.is_active = true AND s.is_active = true
          AND (
            s.full_name ILIKE $1
            OR s.primary_mobile ILIKE $1
          )
      `;

      const dataSql = `
        SELECT ${selectCols}
        ${fromJoin}
        WHERE hk.is_active = true AND s.is_active = true
          AND (
            s.full_name ILIKE $1
            OR s.primary_mobile ILIKE $1
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
      ${fromJoin}
      WHERE hk.is_active = true AND s.is_active = true
    `;

    const dataSql = `
      SELECT ${selectCols}
      ${fromJoin}
      WHERE hk.is_active = true AND s.is_active = true
      ORDER BY ${sortColumn} ${order}
      LIMIT $1::int OFFSET $2::int
    `;

    const [{ count }] = (await this.db.query(countSql)).rows;
    const { rows } = await this.db.query(dataSql, [limit, offset]);

    return { data: rows, totalCount: count };
  }

  async findOneByName(name: string) {
    const sql = `
      SELECT hk.*, s.*
      FROM m_housekeeping hk
      JOIN m_staff s ON s.staff_id = hk.staff_id
      WHERE s.full_name = $1 AND hk.is_active = true AND s.is_active = true
    `;
    const res = await this.db.query(sql, [name]);
    return res.rows[0];
  }

  async findOneById(hkId: string) {
    const res = await this.db.query(
      `SELECT
        hk.hk_id,
        hk.shift,
        hk.is_active,
        s.staff_id,
        s.full_name,
        s.full_name_local_language,
        s.primary_mobile,
        s.alternate_mobile,
        s.address
      FROM m_housekeeping hk
      JOIN m_staff s ON s.staff_id = hk.staff_id
      WHERE hk.hk_id = $1 AND hk.is_active = true AND s.is_active = true`,
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
        FROM m_housekeeping hk
        JOIN m_staff s ON s.staff_id = hk.staff_id
        WHERE LOWER(s.full_name) = LOWER($1)
          AND hk.is_active = TRUE
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
        FROM m_housekeeping hk
        JOIN m_staff s ON s.staff_id = hk.staff_id
        WHERE s.primary_mobile = $1
          AND hk.is_active = TRUE AND s.is_active = true
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

      const staffId = await this.generateStaffId(client);
      const hkId = await this.generateId(client);
      const local = transliterateToDevanagari(dto.hk_name);

      // 1️⃣ Insert into m_staff
      await client.query(`
        INSERT INTO m_staff (
          staff_id,
          full_name,
          full_name_local_language,
          primary_mobile,
          alternate_mobile,
          address,
          designation,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,$6,'Housekeeping',true,NOW(),$7,$8)
      `, [
        staffId,
        dto.hk_name,
        local,
        dto.hk_contact,
        dto.hk_alternate_contact ?? null,
        dto.address ?? null,
        user,
        ip
      ]);

    await client.query(`
      INSERT INTO m_housekeeping (
        hk_id,
        staff_id,
        shift,
        is_active,
        inserted_at,
        inserted_by,
        inserted_ip
      )
      VALUES ($1,$2,$3,true,NOW(),$4,$5)
    `, [
      hkId,
      staffId,
      dto.shift,
      user,
      ip
    ]);

    // 🔥 Return full joined structure
    const fullRes = await client.query(`
      SELECT
        hk.hk_id,
        s.full_name AS hk_name,
        s.full_name_local_language,
        s.primary_mobile AS hk_contact,
        s.alternate_mobile AS hk_alternate_contact,
        s.address,
        hk.shift,
        hk.is_active
      FROM m_housekeeping hk
      JOIN m_staff s ON s.staff_id = hk.staff_id
      WHERE hk.hk_id = $1
    `, [hkId]);

    return fullRes.rows[0];
    });
  }

  async update(hkId: string, dto: UpdateHousekeepingDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `
        SELECT hk.*, s.*
        FROM m_housekeeping hk
        JOIN m_staff s ON s.staff_id = hk.staff_id
        WHERE hk.hk_id = $1
        FOR UPDATE
        `,
        [hkId]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Housekeeping '${hkId}' not found`);
      }

      const existing = existingRes.rows[0];

      // 🔹 Name conflict check
      if (dto.hk_name && dto.hk_name !== existing.full_name) {
        const nameConflict = await client.query(
          `
          SELECT 1
          FROM m_housekeeping hk
          JOIN m_staff s ON s.staff_id = hk.staff_id
          WHERE LOWER(s.full_name) = LOWER($1)
            AND hk.hk_id <> $2
            AND hk.is_active = TRUE
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
        FROM t_guest_hk
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

      const primaryContact = dto.hk_contact ?? existing.primary_mobile;
      const alternateContact = dto.hk_alternate_contact ?? existing.alternate_mobile;

      if (alternateContact && primaryContact === alternateContact) {
        throw new BadRequestException(
          'Primary contact and alternate contact cannot be the same'
        );
      }

      if (dto.hk_contact && dto.hk_contact !== existing.primary_mobile) {
        const contactConflict = await client.query(
          `
          SELECT 1
          FROM m_housekeeping hk
          JOIN m_staff s ON s.staff_id = hk.staff_id
          WHERE s.primary_mobile = $1
            AND hk.hk_id <> $2
            AND hk.is_active = TRUE
            AND s.is_active = true
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

      const cleanedName = dto.hk_name?.trim() ?? existing.full_name;
      const hk_name_local_language = transliterateToDevanagari(cleanedName);

      // 1️⃣ Update m_staff
      await client.query(
        `
        UPDATE m_staff SET
          full_name = $1,
          full_name_local_language = $2,
          primary_mobile = $3,
          alternate_mobile = $4,
          address = $5,
          updated_at = NOW(),
          updated_by = $6,
          updated_ip = $7
        WHERE staff_id = $8
        `,
        [
          cleanedName,
          hk_name_local_language,
          dto.hk_contact ?? existing.primary_mobile,
          dto.hk_alternate_contact ?? existing.alternate_mobile,
          dto.address ?? existing.address,
          user,
          ip,
          existing.staff_id,
        ]
      );

      // 2️⃣ Update m_housekeeping
      const res = await client.query(
        `
        UPDATE m_housekeeping SET
          shift = $1,
          is_active = $2,
          updated_at = NOW(),
          updated_by = $3,
          updated_ip = $4
        WHERE hk_id = $5
        RETURNING *;
        `,
        [
          dto.shift ?? existing.shift,
          dto.is_active ?? existing.is_active,
          user,
          ip,
          hkId,
        ]
      );

      const fullRes = await client.query(`
        SELECT
          hk.hk_id,
          s.full_name AS hk_name,
          s.full_name_local_language,
          s.primary_mobile AS hk_contact,
          s.alternate_mobile AS hk_alternate_contact,
          s.address,
          hk.shift,
          hk.is_active
        FROM m_housekeeping hk
        JOIN m_staff s ON s.staff_id = hk.staff_id
        WHERE hk.hk_id = $1
      `, [hkId]);

      return fullRes.rows[0];
    });
  }

  async softDelete(hkId: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `
        SELECT hk.*, s.staff_id
        FROM m_housekeeping hk
        JOIN m_staff s ON s.staff_id = hk.staff_id
        WHERE hk.hk_id = $1
        FOR UPDATE
        `,
        [hkId]
      );

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Housekeeping '${hkId}' not found`);
      }

      const existing = existingRes.rows[0];

      const assigned = await client.query(
        `
        SELECT 1
        FROM t_guest_hk
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

      // 1️⃣ Deactivate m_housekeeping
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

      // 2️⃣ Deactivate m_staff
      await client.query(
        `
        UPDATE m_staff
        SET is_active = false,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE staff_id = $3
        `,
        [user, ip, existing.staff_id]
      );

      return res.rows[0];
    });
  }
}
