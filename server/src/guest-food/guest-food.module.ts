import { Module } from '@nestjs/common';
import { GuestFoodController } from './guest-food.controller';
import { GuestFoodService } from './guest-food.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestFoodController],
  providers: [GuestFoodService]
})
export class GuestFoodModule {}
