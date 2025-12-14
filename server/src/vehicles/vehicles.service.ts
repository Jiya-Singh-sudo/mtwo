import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
    constructor(private readonly db: DatabaseService) {}

    // This is NOT a master-table API.
// This is a READ MODEL for the Vehicle Management page.
async getFleetOverview() {
  const sql = `
    SELECT
      v.vehicle_no,
      v.vehicle_name,

      CASE
        WHEN gv.is_active = TRUE THEN 'ON_DUTY'
        ELSE 'AVAILABLE'
      END AS status,

      gv.location,
      g.guest_name,
      d.driver_name

    FROM m_vehicle v
    LEFT JOIN t_guest_vehicle gv
      ON gv.vehicle_no = v.vehicle_no
     AND gv.is_active = TRUE
    LEFT JOIN m_guest g
      ON g.guest_id = gv.guest_id
    LEFT JOIN m_driver d
      ON d.driver_id = gv.driver_id

    WHERE v.is_active = TRUE
    ORDER BY v.vehicle_name;
  `;

  const res = await this.db.query(sql);
  return res.rows;
}


    async findAll(activeOnly = true) {
        const sql = activeOnly
        ? `SELECT * FROM m_vehicle WHERE is_active = $1 ORDER BY vehicle_name`
        : `SELECT * FROM m_vehicle ORDER BY vehicle_name`;

        const result = await this.db.query(sql, activeOnly ? [true] : []);
        return result.rows;
    }

    async findOne(vehicle_no: string) {
        const sql = `SELECT * FROM m_vehicle WHERE vehicle_no = $1`;
        const result = await this.db.query(sql, [vehicle_no]);
        return result.rows[0];
    }

    async create(dto: CreateVehicleDto, user: string, ip: string) {
        const now = new Date().toLocaleString("en-GB", {
            timeZone: "Asia/Kolkata",
            hour12: false,
        }).replace(",", "");

        const sql = `
            INSERT INTO m_vehicle (
                vehicle_no,
                vehicle_name,
                model,
                manufacturing,
                capacity,
                color,
                is_active,
                inserted_at, inserted_by, inserted_ip,
                updated_at, updated_by, updated_ip
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NULL, NULL, NULL)
            RETURNING *;
        `;

        const params = [
            dto.vehicle_no,
            dto.vehicle_name,
            dto.model,
            dto.manufacturing,
            dto.capacity,
            dto.color,
            true,
            now,
            user,
            ip
        ];

        const result = await this.db.query(sql, params);
        return result.rows[0];
    }

    async update(vehicle_no: string, dto: UpdateVehicleDto, user: string, ip: string) {
        const now = new Date().toLocaleString("en-GB", {
            timeZone: "Asia/Kolkata",
            hour12: false,
        }).replace(",", "");

        const existing = await this.findOne(vehicle_no);
        if (!existing) {
            throw new Error(`Vehicle '${vehicle_no}' not found`);
        }

        const sql = `
            UPDATE m_vehicle SET
                vehicle_name = $1,
                model = $2,
                manufacturing = $3,
                capacity = $4,
                color = $5,
                is_active = $6,
                updated_at = $7,
                updated_by = $8,
                updated_ip = $9
            WHERE vehicle_no = $10
            RETURNING *;
        `;

        const params = [
            dto.vehicle_name ?? existing.vehicle_name,
            dto.model ?? existing.model,
            dto.manufacturing ?? existing.manufacturing,
            dto.capacity ?? existing.capacity,
            dto.color ?? existing.color,
            dto.is_active ?? existing.is_active,
            now,
            user,
            ip,
            vehicle_no
        ];

        const result = await this.db.query(sql, params);
        return result.rows[0];
    }

    async softDelete(vehicle_no: string, user: string, ip: string) {
        const now = new Date().toISOString();

        const sql = `
            UPDATE m_vehicle SET
                is_active = false,
                updated_at = $1,
                updated_by = $2,
                updated_ip = $3
            WHERE vehicle_no = $4
            RETURNING *;
        `;

        const result = await this.db.query(sql, [now, user, ip, vehicle_no]);
        return result.rows[0];
    }
}
