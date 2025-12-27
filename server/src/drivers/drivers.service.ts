import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateDriverDto } from './dto/createDriver.dto';
import { UpdateDriverDto } from './dto/updateDriver.dto';

@Injectable()
export class DriversService {
  constructor(private readonly db: DatabaseService) {}
  
  // Generate ID like D001, D002 ...
  private async generateDriverId(): Promise<string> {
    const sql = `SELECT driver_id FROM m_driver ORDER BY driver_id DESC LIMIT 1`;
    const result = await this.db.query(sql);

    if (result.rows.length === 0) {
      return 'D001';
    }

    const lastId = result.rows[0].driver_id; // e.g. 'D015'
    const number = parseInt(lastId.replace('D', '')) + 1;
    return 'D' + number.toString().padStart(3, '0');
  }

  async getDriverDashboard() {
  const sql = `
SELECT
  d.driver_id,
  d.driver_name,
  d.driver_contact,
  d.driver_license,

  CASE
    WHEN gv.driver_id IS NULL THEN 'Available'
    ELSE 'On Duty'
  END AS duty_status,

  CASE
    WHEN gv.driver_id IS NULL THEN false
    ELSE true
  END AS is_assigned,

  gv.vehicle_no,
  g.guest_name
FROM m_driver d
LEFT JOIN t_guest_vehicle gv
  ON gv.driver_id = d.driver_id
 AND gv.is_active = TRUE
LEFT JOIN m_guest g
  ON g.guest_id = gv.guest_id
WHERE d.is_active = TRUE
ORDER BY d.driver_name;

  `;

  const res = await this.db.query(sql);
  return res.rows;
}
async create(dto: CreateDriverDto, user: string, ip: string) {
  const sql = `
    INSERT INTO m_driver
      (driver_id, driver_name, driver_contact, driver_license,
       is_active, inserted_by, inserted_ip)
    VALUES
      ($1,$2,$3,$4, TRUE,$5,$6)
    RETURNING driver_id, driver_name;
  `;

 const driverId = await this.generateDriverId();


  const res = await this.db.query(sql, [
    driverId,
    dto.driver_name,
    dto.driver_contact,
    dto.driver_license_number || null,
    user,
    ip
  ]);

  return res.rows[0];
}

async assignDriver(
  payload: { guest_vehicle_id: string; driver_id: string },
  user: string,
  ip: string
) {
  const sql = `
    UPDATE t_guest_vehicle
    SET
      driver_id = $2,
      updated_at = NOW(),
      updated_by = $3,
      updated_ip = $4
    WHERE guest_vehicle_id = $1
      AND is_active = TRUE
    RETURNING *;
  `;

  const res = await this.db.query(sql, [
    payload.guest_vehicle_id,
    payload.driver_id,
    user,
    ip
  ]);

  return res.rows[0];
}




  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM m_driver WHERE is_active = $1 ORDER BY driver_name`
      : `SELECT * FROM m_driver ORDER BY driver_name`;

    const result = await this.db.query(sql, activeOnly ? [true] : []);
    return result.rows;
  }

  async findOneByName(driver_name: string) {
    const sql = `SELECT * FROM m_driver WHERE driver_name = $1`;
    const result = await this.db.query(sql, [driver_name]);
    return result.rows[0];
  }

  async findOneById(driver_id: string) {
    const sql = `SELECT * FROM m_driver WHERE driver_id = $1`;
    const result = await this.db.query(sql, [driver_id]);
    return result.rows[0];
  }

  
  async update(driver_id: string, dto: UpdateDriverDto, user: string, ip: string) {
    const existing = await this.findOneById(driver_id);
    if (!existing) {
      throw new Error(`Driver '${driver_id}' not found`);
    }

    const now = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
    }).replace(',', '');

    const sql = `
      UPDATE m_driver SET
        driver_name = $1,
        driver_name_local_language = $2,
        driver_contact = $3,
        driver_alternate_mobile = $4,
        driver_license = $5,
        address = $6,
        is_active = $7,
        updated_at = $8,
        updated_by = $9,
        updated_ip = $10
      WHERE driver_id = $11
      RETURNING *;
    `;

    const params = [
      dto.driver_name ?? existing.driver_name,
      dto.driver_name_ll ?? existing.driver_name_local,
      dto.driver_contact ?? existing.driver_contact,
      dto.driver_alternate_contact ?? existing.driver_alternate_mobile,
      dto.driver_license_number ?? existing.driver_license,
      dto.address ?? existing.address,
      dto.is_active ?? existing.is_active,
      now,
      user,
      ip,
      driver_id,
    ];

    const result = await this.db.query(sql, params);
    return result.rows[0];
  }

  async softDelete(driver_name: string, user: string, ip: string) {
    const existing = await this.findOneByName(driver_name);
    if (!existing) {
      throw new Error(`Driver '${driver_name}' not found`);
    }

    const driver_id = existing.driver_id;

    const now = new Date().toISOString();

    const sql = `
      UPDATE m_driver SET
        is_active = false,
        updated_at = $1,
        updated_by = $2,
        updated_ip = $3
      WHERE driver_id = $4
      RETURNING *;
    `;

    const result = await this.db.query(sql, [now, user, ip, driver_id]);
    return result.rows[0];
  }
 

}
