import { Module } from '@nestjs/common';
import { GuestVehicleController } from './guest_vehicle.controller';
import { GuestVehicleService } from './guest_vehicle.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestVehicleController],
  providers: [GuestVehicleService]
})
export class GuestVehicleModule {}
