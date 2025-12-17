import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

@Module({
  providers: [
    {
      provide: 'PG',
      useFactory: async () => {
        const pool = new Pool({
          user: 'postgres',
          host: 'localhost',
          database: 'RajbhavanDB',
          password: 'admin',
          port: 5432,
        });
        return pool;
      },
    },
    DatabaseService,
  ],
  exports: ['PG', DatabaseService], 
})
export class DatabaseModule {}
