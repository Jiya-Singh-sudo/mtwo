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
          host: '192.168.0.239',
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
