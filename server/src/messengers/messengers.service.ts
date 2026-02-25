import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateMessengerDto } from './dto/create-messenger.dto';
import { UpdateMessengerDto } from './dto/update-messenger.dto';
import { MessengerTableQueryDto } from './dto/messenger-table-query.dto';
import { transliterateToDevanagari } from '../../common/utlis/transliteration.util';
import { ActivityLogService } from '../activity-log/activity-log.service';
@Injectable()
export class MessengerService {
  constructor(private readonly db: DatabaseService, private readonly activityLog: ActivityLogService) { }

  /* ---------- ID GENERATION ---------- */
  private async generateMessengerId(client: any): Promise<string> {
    const res = await client.query(`
    SELECT 'M' || LPAD(nextval('messenger_seq')::text, 3, '0') AS id
  `);
    return res.rows[0].id;
  }
  private async generateStaffId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'S' || LPAD(nextval('staff_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }
  /* ---------- FIND BY ID ---------- */
  async findOneById(id: string) {
    const res = await this.db.query(
      `SELECT * FROM m_messenger WHERE messenger_id = $1`,
      [id],
    );
    if (!res.rowCount) {
      throw new NotFoundException(`Messenger '${id}' not found`);
    }
    if (!/^M\d+$/.test(id)) {
      throw new BadRequestException('Invalid messenger ID format');
    }
    return res.rows[0];
  }

  /* ---------- CREATE ---------- */
  async create(dto: CreateMessengerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      // Normalize input
      const name = dto.messenger_name?.trim();
      const primaryMobile = dto.primary_mobile?.trim();
      const secondaryMobile = dto.secondary_mobile?.trim() || null;
      const email = dto.email?.trim() || null;
      if (!name) {
        throw new BadRequestException('Messenger name is required');
      }
      if (name.length > 100) {
        throw new BadRequestException('Messenger name cannot exceed 100 characters');
      }
      if (!/^\d{10}$/.test(primaryMobile)) {
        throw new BadRequestException('Primary mobile must be 10 digits');
      }
      if (secondaryMobile) {
        const secondaryExists = await client.query(`
          SELECT 1 FROM m_staff
          WHERE primary_mobile = $1
            AND is_active = true
          LIMIT 1
        `, [secondaryMobile]);

        if (secondaryExists.rowCount > 0) {
          throw new BadRequestException(
            `Mobile '${secondaryMobile}' already exists`
          );
        }
      }
      if (secondaryMobile && !/^\d{10}$/.test(secondaryMobile)) {
        throw new BadRequestException('Secondary mobile must be 10 digits');
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestException('Invalid email format');
      }
      if (dto.designation && dto.designation.length > 100) {
        throw new BadRequestException('Designation cannot exceed 100 characters');
      }
      if (dto.remarks && dto.remarks.length > 255) {
        throw new BadRequestException('Remarks cannot exceed 255 characters');
      }
      const messenger_id = await this.generateMessengerId(client);
      const staff_id = await this.generateStaffId(client);
      const messenger_name_local_language = transliterateToDevanagari(dto.messenger_name);
      const mobileExists = await client.query(`
        SELECT 1 FROM m_staff
        WHERE primary_mobile = $1
          AND is_active = true
        LIMIT 1
      `, [primaryMobile]);

      if (mobileExists.rowCount > 0) {
        throw new BadRequestException(
          `Mobile '${primaryMobile}' already exists`
        );
      }
      if (email) {
        const emailExists = await client.query(`
          SELECT 1 FROM m_staff
          WHERE email = $1
          AND is_active = true
          LIMIT 1
        `, [email]);

        if (emailExists.rowCount > 0) {
          throw new BadRequestException(
            `Email '${email}' already exists`
          );
        }
      }
      // 1️⃣ Create staff record
      await client.query(`
        INSERT INTO m_staff (
          staff_id,
          full_name,
          full_name_local_language,
          primary_mobile,
          alternate_mobile,
          email,
          designation,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW(),$8,$9)
      `, [
        staff_id,
        dto.messenger_name,
        messenger_name_local_language,
        dto.primary_mobile ?? null,
        dto.secondary_mobile ?? null,
        dto.email ?? null,
        dto.designation ?? null,
        user,
        ip
      ]);

      // 2️⃣ Create messenger record
      const res = await client.query(`
        INSERT INTO m_messenger (
          messenger_id,
          staff_id,
          remarks,
          is_active,
          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,true,NOW(),$4,$5)
        RETURNING *
      `, [
        messenger_id,
        staff_id,
        dto.remarks ?? null,
        user,
        ip
      ]);
      await this.activityLog.log({
        message: 'New Messenger created successfully',
        module: 'MESSENGER',
        action: 'CREATE',
        referenceId: messenger_id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }

  /* ---------- UPDATE ---------- */
  async update(id: string, dto: UpdateMessengerDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const name = dto.messenger_name?.trim();
      const primaryMobile = dto.primary_mobile?.trim();
      const secondaryMobile = dto.secondary_mobile?.trim() || null;
      const email = dto.email?.trim() || null;
      if (dto.messenger_name) {
        if (!name) {
          throw new BadRequestException('Messenger name cannot be empty');
        }
        if (name.length > 100) {
          throw new BadRequestException('Messenger name cannot exceed 100 characters');
        }
      }
      if (primaryMobile && !/^\d{10}$/.test(primaryMobile)) {
        throw new BadRequestException('Primary mobile must be 10 digits');
      }
      if (secondaryMobile && !/^\d{10}$/.test(secondaryMobile)) {
        throw new BadRequestException('Secondary mobile must be 10 digits');
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestException('Invalid email format');
      }
      if (primaryMobile && secondaryMobile && primaryMobile === secondaryMobile) {
        throw new BadRequestException('Primary and secondary mobile cannot be the same');
      }
      if (dto.remarks && dto.remarks.length > 255) {
        throw new BadRequestException('Remarks cannot exceed 255 characters');
      }
      if (!/^M\d+$/.test(id)) {
        throw new BadRequestException('Invalid messenger ID format');
      }
      if (dto.is_active === false) {
        const assigned = await client.query(`
          SELECT 1
          FROM t_guest_messenger
          WHERE messenger_id = $1
            AND is_active = TRUE
          LIMIT 1
        `, [id]);

        if (assigned.rowCount > 0) {
          throw new BadRequestException(
            'Cannot deactivate messenger while assigned'
          );
        }
      }
      const existingRes = await client.query(`
        SELECT m.*, s.*
        FROM m_messenger m
        INNER JOIN m_staff s ON s.staff_id = m.staff_id
        WHERE m.messenger_id = $1 AND m.is_active = true AND s.is_active = true
        FOR UPDATE
      `, [id]);

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Messenger '${id}' not found`);
      }

      const existing = existingRes.rows[0];
      if (primaryMobile) {
        const mobileExists = await client.query(`
          SELECT 1
          FROM m_staff s
          INNER JOIN m_messenger m ON m.staff_id = s.staff_id
          WHERE s.primary_mobile = $1
            AND m.messenger_id <> $2
            AND s.is_active = true
          LIMIT 1
        `, [primaryMobile, id]);

        if (mobileExists.rowCount > 0) {
          throw new BadRequestException(
            `Mobile '${primaryMobile}' already exists`
          );
        }
      }
      if (email) {
        const emailExists = await client.query(`
          SELECT 1
          FROM m_staff s
          INNER JOIN m_messenger m ON m.staff_id = s.staff_id
          WHERE s.email = $1
            AND m.messenger_id <> $2
            AND s.is_active = true
          LIMIT 1
        `, [email, id]);

        if (emailExists.rowCount > 0) {
          throw new BadRequestException(
            `Email '${email}' already exists`
          );
        }
      }
      const updatedName = dto.messenger_name ?? existing.full_name;
      const updatedLocal =
        dto.messenger_name
          ? transliterateToDevanagari(dto.messenger_name)
          : existing.full_name_local_language;

      // 1️⃣ Update staff
      await client.query(`
        UPDATE m_staff SET
          full_name = $1,
          full_name_local_language = $2,
          primary_mobile = $3,
          alternate_mobile = $4,
          email = $5,
          designation = $6,
          updated_at = NOW(),
          updated_by = $7,
          updated_ip = $8
        WHERE staff_id = $9
      `, [
        updatedName,
        updatedLocal,
        dto.primary_mobile ?? existing.primary_mobile,
        dto.secondary_mobile ?? existing.alternate_mobile,
        dto.email ?? existing.email,
        dto.designation ?? existing.designation,
        user,
        ip,
        existing.staff_id
      ]);

      // 2️⃣ Update messenger
      const res = await client.query(`
        UPDATE m_messenger SET
          remarks = $1,
          is_active = $2,
          updated_at = NOW(),
          updated_by = $3,
          updated_ip = $4
        WHERE messenger_id = $5
        RETURNING *
      `, [
        dto.remarks ?? existing.remarks,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        id
      ]);
      await this.activityLog.log({
        message: 'Messenger details updated successfully',
        module: 'MESSENGER',
        action: 'UPDATE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }

  /* ---------- SOFT DELETE ---------- */
  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(`
        SELECT m.messenger_id, m.staff_id, s.full_name
        FROM m_messenger m
        INNER JOIN m_staff s ON s.staff_id = m.staff_id
        WHERE m.messenger_id = $1 AND m.is_active = true AND s.is_active = true
        FOR UPDATE
      `, [id]);

      if (!existingRes.rowCount) {
        throw new NotFoundException(`Messenger '${id}' not found`);
      }
      if (!existingRes.rows[0].is_active) {
        throw new BadRequestException('Messenger already inactive');
      }
      const { staff_id, full_name } = existingRes.rows[0];

      // Block if assigned
      const assigned = await client.query(`
        SELECT 1
        FROM t_guest_messenger
        WHERE messenger_id = $1
          AND is_active = TRUE
        LIMIT 1
      `, [id]);

      if (assigned.rowCount > 0) {
        throw new BadRequestException(
          `Cannot delete messenger '${full_name}' because it is assigned`
        );
      }
      if (!/^M\d+$/.test(id)) {
        throw new BadRequestException('Invalid messenger ID format');
      }
      // Deactivate messenger
      await client.query(`
        UPDATE m_messenger
        SET is_active = FALSE,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE messenger_id = $3
      `, [user, ip, id]);

      // Deactivate staff
      await client.query(`
        UPDATE m_staff
        SET is_active = FALSE,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE staff_id = $3
      `, [user, ip, staff_id]);
      await this.activityLog.log({
        message: 'Messenger deleted successfully',
        module: 'MESSENGER',
        action: 'DELETE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return { message: 'Messenger deleted successfully' };
    });
  }

  /* ---------- DATA TABLE ---------- */
  async getMessengerTable(query: MessengerTableQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    /* ---------- SORT WHITELIST ---------- */
    const SORT_MAP: Record<string, string> = {
      messenger_name: 'messenger_name',
      primary_mobile: 'primary_mobile',
      designation: 'designation',
      inserted_at: 'inserted_at',
    };
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException('Page and limit must be greater than 0');
    }

    if (limit > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }
    if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) {
      throw new BadRequestException('Invalid sort order');
    }
    const sortColumn = SORT_MAP[query.sortBy ?? 'messenger_name'] ?? 'messenger_name';
    const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const allowedStatuses = ['all', 'active', 'inactive'];
    if (query.status && !allowedStatuses.includes(query.status)) {
      throw new BadRequestException('Invalid status filter');
    }
    /* ---------- FILTERS ---------- */
    const where: string[] = [];
    const params: any[] = [];

    // status filters
    if (query.status === 'active') {
      where.push('m.is_active = true AND s.is_active = true');
    }

    if (query.status === 'inactive') {
      where.push('m.is_active = false AND s.is_active = false');
    }

//     if (query.status === 'assigned') {
//       where.push(`
//         m.is_active = true
//         AND EXISTS (
//           SELECT 1
//           FROM t_guest_messenger tgm
//           WHERE tgm.messenger_id = m.messenger_id
//             AND tgm.is_active = true
//         )
//       `);
//     }

// if (query.status === 'unassigned') {
//   where.push(`
//     m.is_active = true
//     AND NOT EXISTS (
//       SELECT 1
//       FROM t_guest_messenger tgm
//       WHERE tgm.messenger_id = m.messenger_id
//         AND tgm.is_active = true
//     )
//   `);
// }

    // search (name, mobile, email)
    if (query.search) {
      params.push(`%${query.search}%`);
      where.push(`
        (
          s.full_name ILIKE $${params.length}
          OR s.primary_mobile ILIKE $${params.length}
          OR s.email ILIKE $${params.length}
        )
      `);
    }

    const whereClause =
      where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    /* ---------- DATA QUERY ---------- */
    const dataSql = `
        SELECT
          m.messenger_id,
          s.full_name AS messenger_name,
          s.full_name_local_language,
          s.primary_mobile,
          s.alternate_mobile AS secondary_mobile,
          s.email,
          s.designation,
          m.remarks,
          m.is_active
        FROM m_messenger m
        LEFT JOIN m_staff s ON s.staff_id = m.staff_id
        ${whereClause}
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2};
    `;

    const countSql = `
        SELECT COUNT(*)::int AS count
        FROM m_messenger m
        ${whereClause};
    `;
    const statsSql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_active = true)::int AS active,
        COUNT(*) FILTER (WHERE is_active = false)::int AS inactive
      FROM m_messenger;
    `;
    // const statsSql = `
    //   SELECT
    //     COUNT(*) FILTER (WHERE is_active = true) AS active,
    //     COUNT(*) FILTER (WHERE is_active = false) AS inactive,
    //     COUNT(*) FILTER (
    //       WHERE is_active = true
    //         AND EXISTS (
    //           SELECT 1 FROM t_guest_messenger tgm
    //           WHERE tgm.messenger_id = m.messenger_id
    //             AND tgm.is_active = true
    //         )
    //     ) AS assigned,
    //     COUNT(*) FILTER (
    //       WHERE is_active = true
    //         AND NOT EXISTS (
    //           SELECT 1 FROM t_guest_messenger tgm
    //           WHERE tgm.messenger_id = m.messenger_id
    //             AND tgm.is_active = true
    //         )
    //     ) AS unassigned
    //   FROM m_messenger m;
    // `;

    const dataRes = await this.db.query(dataSql, [...params, limit, offset]);
    const countRes = await this.db.query(countSql, params);
    const statsRes = await this.db.query(statsSql);

    return {
      data: dataRes.rows,
      totalCount: countRes.rows[0].count,
      stats: statsRes.rows[0],
    };
  }
}