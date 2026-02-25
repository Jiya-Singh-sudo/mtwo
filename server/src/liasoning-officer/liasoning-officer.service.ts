// server/src/modules/liasoning-officer/liasoning-officer.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateLiasoningOfficerDto, UpdateLiasoningOfficerDto } from './dto/liasoning-officer.dto';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
@Injectable()
export class LiasoningOfficerService {
    constructor(private readonly db: DatabaseService, private readonly activityLog: ActivityLogService) { }
    private async generateId(client: any): Promise<string> {
        const res = await client.query(`
        SELECT 'LO' || LPAD(nextval('liasoning_officer_seq')::text, 3, '0') AS id
        `);
        return res.rows[0].id;
    }
    private async generateStaffId(client: any): Promise<string> {
        const res = await client.query(`
        SELECT 'S' || LPAD(nextval('staff_seq')::text,3,'0') AS id
        `);
        return res.rows[0].id;
    }
    async create(dto: CreateLiasoningOfficerDto, userId: string, ip: string) {
    return this.db.transaction(async (trx) => {
        const officerId = await this.generateId(trx);
        const staffId = await this.generateStaffId(trx);
        try {
            // 1️⃣ Insert into m_staff
            await trx.query(`
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
            VALUES ($1,$2,$3,$4,$5,$6,'Liasoning Officer',true,NOW(),$7,$8)
            `, [
            staffId,
            dto.officer_name,
            dto.officer_name_local_language,
            dto.mobile ?? null,
            dto.alternate_mobile ?? null,
            dto.email ?? null,
            userId,
            ip
            ]);

            // 2️⃣ Insert into m_liasoning_officer
            await trx.query(`
            INSERT INTO m_liasoning_officer (
                officer_id,
                staff_id,
                role_id,
                is_active,
                inserted_at,
                inserted_by,
                inserted_ip
            )
            VALUES ($1,$2,$3,true,NOW(),$4,$5)
            `, [
            officerId,
            staffId,
            dto.role_id,
            userId,
            ip
            ]);
        await this.activityLog.log({
          message: 'New Liasoning Officer created successfully',
          module: 'LIASONING_OFFICER',
          action: 'CREATE',
          referenceId: officerId,
          performedBy: userId,
          ipAddress: ip,
        }, trx);
        return { 
            message: 'Officer created successfully',
            officerId 
            };

        } catch (err: any) {
        if (err.code === '23505') { // PostgreSQL unique_violation
            throw new ConflictException('Officer already exists');
        }
        throw err;
        }
    });
    }

    async findAll() {
        const result = await this.db.query(
            `SELECT 
                lo.officer_id,
                s.full_name AS officer_name,
                s.full_name_local_language,
                s.primary_mobile AS mobile,
                s.alternate_mobile,
                s.email,
                lo.role_id,
                lo.is_active
                FROM m_liasoning_officer lo
                LEFT JOIN m_staff s ON s.staff_id = lo.staff_id
                WHERE lo.is_active = true
                ORDER BY s.full_name
            `
        );
        return result.rows;
    }

    async findOne(id: string) {
        const result = await this.db.query(
            `SELECT 
                lo.officer_id,
                lo.staff_id,
                lo.role_id,
                lo.is_active,
                s.full_name,
                s.full_name_local_language,
                s.primary_mobile,
                s.alternate_mobile,
                s.email
                FROM m_liasoning_officer lo
                LEFT JOIN m_staff s ON s.staff_id = lo.staff_id
                WHERE lo.officer_id = $1
            `,
            [id]
        );

        if (!result.rowCount) {
            throw new NotFoundException('Officer not found');
        }

        return result.rows[0];
    }

    async update(id: string, dto: UpdateLiasoningOfficerDto, userId: string, ip: string) {
        return this.db.transaction(async (trx) => {

            const existingRes = await trx.query(
                `SELECT lo.*, s.*
                FROM m_liasoning_officer lo
                JOIN m_staff s ON s.staff_id = lo.staff_id
                WHERE lo.officer_id = $1
                FOR UPDATE`,
                [id]
            );

            if (!existingRes.rowCount) {
                throw new NotFoundException('Officer not found');
            }
            const existing = existingRes.rows[0];
    
            await trx.query(`
            UPDATE m_staff
            SET
                full_name = $1,
                full_name_local_language = $2,
                primary_mobile = $3,
                alternate_mobile = $4,
                email = $5,
                updated_at = NOW(),
                updated_by = $6,
                updated_ip = $7
            WHERE staff_id = $8
            `, [
            dto.officer_name ?? existing.full_name,
            dto.officer_name_local_language ?? existing.full_name_local_language,
            dto.mobile ?? existing.primary_mobile,
            dto.alternate_mobile ?? existing.alternate_mobile,
            dto.email ?? existing.email,
            userId,
            ip,
            existing.staff_id
            ]);

            const allowedFields = [
            'officer_name',
            'officer_name_local_language',
            'mobile',
            'alternate_mobile',
            'email',
            'role_id',
            'department',
            'designation',
            'is_active'
            ];
            /* ------------------ UPDATE LIAISON TABLE ------------------ */
            const result = await trx.query(`
            UPDATE m_liasoning_officer
            SET
                role_id = $1,
                is_active = $4,
                updated_at = NOW(),
                updated_by = $5,
                updated_ip = $6
            WHERE officer_id = $7
            RETURNING *
            `, [
            dto.role_id ?? existing.role_id,
            dto.is_active ?? existing.is_active,
            userId,
            ip,
            id
            ]);
        await this.activityLog.log({
          message: 'Liasoning Officer details updated successfully',
          module: 'LIASONING_OFFICER',
          action: 'UPDATE',
          referenceId: id,
          performedBy: userId,
          ipAddress: ip,
        }, trx);
            return result.rows[0];
        });
    }
    async softDelete(id: string, userId: string, ip: string) {
    return this.db.transaction(async (trx) => {

        const existingRes = await trx.query(
        `SELECT lo.officer_id, lo.staff_id
        FROM m_liasoning_officer lo
        WHERE lo.officer_id = $1
        FOR UPDATE`,
        [id]
        );

        if (!existingRes.rowCount) {
        throw new NotFoundException('Officer not found');
        }

        const { staff_id } = existingRes.rows[0];

        /* 1️⃣ Deactivate liaison record */
        await trx.query(`
        UPDATE m_liasoning_officer
        SET is_active = false,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE officer_id = $3
        `, [userId, ip, id]);

        /* 2️⃣ Deactivate staff record */
        await trx.query(`
        UPDATE m_staff
        SET is_active = false,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE staff_id = $3
        `, [userId, ip, staff_id]);
        await this.activityLog.log({
          message: 'Liasoning Officer deleted successfully',
          module: 'LIASONING_OFFICER',
          action: 'DELETE',
          referenceId: id,
          performedBy: userId,
          ipAddress: ip,
        }, trx);
        return { message: 'Officer deleted successfully' };
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
                s.full_name ILIKE $${idx}
                OR s.primary_mobile ILIKE $${idx}
                OR s.email ILIKE $${idx}
                OR lo.officer_id ILIKE $${idx}
            )
        `);
        values.push(`%${search}%`);
        idx++;
    }

    /* ---------- ACTIVE FILTER ---------- */
    if (typeof isActive === 'boolean') {
        where.push(`lo.is_active = $${idx}`);
        values.push(isActive);
        idx++;
    }

    /* ---------- SORT ---------- */
    const allowedSorts: Record<string, string> = {
        officer_name: 's.full_name',
        department: 'lo.department_id',
        designation: 'lo.designation_id',
        inserted_at: 'lo.inserted_at',
    };

    const sortColumn =
        allowedSorts[sortBy ?? 'inserted_at'] ?? allowedSorts.inserted_at;

    const sortDirection =
        sortOrder === 'asc' ? 'ASC' : 'DESC';

    /* ---------- COUNT QUERY ---------- */
    const countSql = `
        SELECT COUNT(*)::int AS total
        FROM m_liasoning_officer lo
        LEFT JOIN m_staff s ON s.staff_id = lo.staff_id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    `;

    /* ---------- DATA QUERY ---------- */
    const dataSql = `
        SELECT
            lo.officer_id,
            s.full_name AS officer_name,
            s.full_name_local_language,
            s.primary_mobile AS mobile,
            s.alternate_mobile,
            s.email,
            lo.role_id,
            lo.is_active,
            lo.inserted_at
        FROM m_liasoning_officer lo
        LEFT JOIN m_staff s ON s.staff_id = lo.staff_id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY ${sortColumn} ${sortDirection}
        LIMIT $${idx} OFFSET $${idx + 1}
    `;
    return this.db.transaction(async (trx) => {
        const countResult = await trx.query(
            countSql,
            values.slice(0, idx - 1)
        );

        values.push(limit, offset);

        const dataResult = await trx.query(dataSql, values);

        return {
            data: dataResult.rows,
            totalCount: countResult.rows[0].total,
        };
    });
    }

}
