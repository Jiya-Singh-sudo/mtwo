import { Module } from '@nestjs/common';
import { GuestDriverController } from './guest-driver.controller';
import { GuestDriverService } from './guest-driver.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestDriverController],
  providers: [GuestDriverService]
})
export class GuestDriverModule {}
