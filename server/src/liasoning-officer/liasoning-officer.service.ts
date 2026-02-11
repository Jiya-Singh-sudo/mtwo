// server/src/modules/liasoning-officer/liasoning-officer.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateLiasoningOfficerDto, UpdateLiasoningOfficerDto } from './dto/liasoning-officer.dto';

@Injectable()
export class LiasoningOfficerService {
    constructor(private readonly db: DatabaseService) { }

    async create(dto: CreateLiasoningOfficerDto, userId: string, ip: string) {
        return this.db.transaction(async (trx) => {

            const existing = await trx.query(
                `SELECT 1 FROM m_liasoning_officer WHERE officer_id = $1`,
                [dto.officer_id]
            );

            if (existing.rowCount > 0) {
                throw new ConflictException('Officer already exists');
            }

            await trx.query(
                `
        INSERT INTO m_liasoning_officer (
          officer_id,
          officer_name,
          officer_name_local_language,
          mobile,
          alternate_mobile,
          email,
          role_id,
          department,
          designation,
          is_active,
          inserted_by,
          inserted_ip
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        `,
                [
                    dto.officer_id,
                    dto.officer_name,
                    dto.officer_name_local_language,
                    dto.mobile,
                    dto.alternate_mobile,
                    dto.email,
                    dto.role_id,
                    dto.department,
                    dto.designation,
                    dto.is_active ?? true,
                    userId,
                    ip
                ]
            );

            return { message: 'Officer created successfully' };
        });
    }

    async findAll() {
        const result = await this.db.query(
            `SELECT * FROM m_liasoning_officer WHERE is_active = true ORDER BY officer_name`
        );
        return result.rows;
    }

    async findOne(id: string) {
        const result = await this.db.query(
            `SELECT * FROM m_liasoning_officer WHERE officer_id = $1`,
            [id]
        );

        if (!result.rowCount) {
            throw new NotFoundException('Officer not found');
        }

        return result.rows[0];
    }

    async update(id: string, dto: UpdateLiasoningOfficerDto, userId: string, ip: string) {
        return this.db.transaction(async (trx) => {

            const existing = await trx.query(
                `SELECT 1 FROM m_liasoning_officer WHERE officer_id = $1`,
                [id]
            );

            if (!existing.rowCount) {
                throw new NotFoundException('Officer not found');
            }

            const fields: string[] = [];
            const values: any[] = [];
            let index = 1;

            for (const key in dto) {
                fields.push(`${key} = $${index}`);
                values.push(dto[key]);
                index++;
            }

            fields.push(`updated_at = CURRENT_TIMESTAMP`);
            fields.push(`updated_by = $${index}`);
            values.push(userId);
            index++;

            fields.push(`updated_ip = $${index}`);
            values.push(ip);

            await trx.query(
                `
        UPDATE m_liasoning_officer
        SET ${fields.join(', ')}
        WHERE officer_id = $${index + 1}
        `,
                [...values, id]
            );

            return { message: 'Officer updated successfully' };
        });
    }

    async softDelete(id: string, userId: string, ip: string) {
        return this.db.transaction(async (trx) => {

            await trx.query(
                `
        UPDATE m_liasoning_officer
        SET is_active = false,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $2,
            updated_ip = $3
        WHERE officer_id = $1
        `,
                [id, userId, ip]
            );

            return { message: 'Officer deactivated successfully' };
        });
    }
    async findAllWithFilters(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    }) {
    const { page, limit, search, isActive, sortBy, sortOrder } = params;

    const offset = (page - 1) * limit;

    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;

    /* ---------- SEARCH ---------- */
    if (search) {
        where.push(`
        (
            officer_name ILIKE $${idx}
            OR mobile ILIKE $${idx}
            OR email ILIKE $${idx}
            OR officer_id ILIKE $${idx}
        )
        `);
        values.push(`%${search}%`);
        idx++;
    }

    /* ---------- ACTIVE FILTER ---------- */
    if (typeof isActive === 'boolean') {
        where.push(`is_active = $${idx}`);
        values.push(isActive);
        idx++;
    }

    /* ---------- SORT ---------- */
    const allowedSorts: Record<string, string> = {
        officer_name: 'officer_name',
        department: 'department',
        designation: 'designation',
        inserted_at: 'inserted_at',
    };

    const sortColumn =
        allowedSorts[sortBy ?? 'inserted_at'] ?? allowedSorts.inserted_at;

    const sortDirection =
        sortOrder === 'asc' ? 'ASC' : 'DESC';

    /* ---------- COUNT QUERY ---------- */
    const countSql = `
        SELECT COUNT(*)::int AS total
        FROM m_liasoning_officer
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    `;

    /* ---------- DATA QUERY ---------- */
    const dataSql = `
        SELECT
        officer_id,
        officer_name,
        officer_name_local_language,
        mobile,
        alternate_mobile,
        email,
        role_id,
        department,
        designation,
        is_active,
        inserted_at
        FROM m_liasoning_officer
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY ${sortColumn} ${sortDirection}
        LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const countResult = await this.db.query(
        countSql,
        values.slice(0, idx - 1)
    );

    values.push(limit, offset);

    const dataResult = await this.db.query(dataSql, values);

    return {
        data: dataResult.rows,
        totalCount: countResult.rows[0].total,
    };
    }

}
