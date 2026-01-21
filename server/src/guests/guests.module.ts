import { Module } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { GuestsController } from './guests.controller';
import { DatabaseModule } from '../database/database.module';
import { GuestStatusJob } from './guests-status.job';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestsController],
  providers: [GuestsService, GuestStatusJob]
})
export class GuestsModule {}
