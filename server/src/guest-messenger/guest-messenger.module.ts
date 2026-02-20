import { Module } from '@nestjs/common';
import { GuestMessengerController } from './guest-messenger.controller';
import { GuestMessengerService } from './guest-messenger.service';
import { DatabaseModule } from 'src/database/database.module';
@Module({
  imports: [DatabaseModule],
  controllers: [GuestMessengerController],
  providers: [GuestMessengerService]
})
export class GuestMessengerModule {}
