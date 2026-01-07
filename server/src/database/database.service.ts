import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService {
  constructor(@Inject('PG') private readonly pool: Pool) {}
  
  async query(sql: string, params: any[] = []) {
  return this.pool.query(sql, params);
}
}
