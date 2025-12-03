import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class GuestService {
  constructor(@Inject('PG') private pool: Pool) {}

  async create(data) {
    const query = `
      INSERT INTO guest 
      (guestName, guestCompanions, guestContact, driver, email, foodPreferences, addDescription)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      data.guestName,
      data.guestCompanions,
      data.guestContact,
      data.driver,
      data.email,
      data.foodPreferences, // array
      data.addDescription,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findAll() {
    const result = await this.pool.query('SELECT * FROM guest ORDER BY created_at DESC;');
    return result.rows;
  }
}
