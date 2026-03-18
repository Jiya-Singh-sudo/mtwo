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
          host: '10.84.233.234',
          database: 'RajbhavanDB',
          password: 'admin',
          port: 5432,
          keepAlive: true,
        });
        return pool;
      },
    },
    DatabaseService,
  ],
  exports: ['PG', DatabaseService], 
})
export class DatabaseModule {}
