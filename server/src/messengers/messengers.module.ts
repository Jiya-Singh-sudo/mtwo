import { Module } from '@nestjs/common';
import { MessengerController } from './messengers.controller';
import { MessengerService } from './messengers.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MessengerController],
  providers: [MessengerService]
})
export class MessengersModule {}
