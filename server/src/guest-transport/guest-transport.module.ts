import { Module } from '@nestjs/common';
import { GuestTransportController } from './guest-transport.controller';
import { GuestTransportService } from './guest-transport.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestTransportController],
  providers: [GuestTransportService]
})
export class GuestTransportModule {}
