import { Module } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';
import { DatabaseModule } from '../database/database.module';
import { GuestStatusJob } from './guests-status.job';

import { GuestTransportModule } from '../guest-transport/guest-transport.module';

@Module({
  imports: [DatabaseModule, GuestTransportModule],
  controllers: [GuestsController],
  providers: [GuestsService, GuestStatusJob]
})
export class GuestsModule { }
