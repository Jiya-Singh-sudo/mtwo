import { Module } from '@nestjs/common';
import { Pool } from 'pg';

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
  ],
  exports: ['PG'],
})
export class DatabaseModule {}
