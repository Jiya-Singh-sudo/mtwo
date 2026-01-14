import { Module } from '@nestjs/common';
import { GuestTransportController } from './guest-transport.controller';
import { GuestTransportService } from './guest-transport.service';

@Module({
  controllers: [GuestTransportController],
  providers: [GuestTransportService]
})
export class GuestTransportModule {}
