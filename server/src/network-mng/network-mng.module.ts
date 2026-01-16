import { Module } from '@nestjs/common';
import { NetworkMngController } from './network-mng.controller';
import { NetworkMngService } from './network-mng.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [NetworkMngController],
  providers: [NetworkMngService],
  imports: [DatabaseModule],
})
export class NetworkMngModule {}
