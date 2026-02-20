import { Module } from '@nestjs/common';
import { GuestInoutController } from './guest-inout.controller';
import { GuestInoutService } from './guest-inout.service';
import { DatabaseModule } from 'src/database/database.module';
import { GuestFoodService } from 'src/guest-food/guest-food.service';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestInoutController],
  providers: [GuestInoutService, GuestFoodService]
})
export class GuestInoutModule {}
