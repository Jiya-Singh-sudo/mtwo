import { Module } from '@nestjs/common';
import { GuestMessengerController } from './guest-messeneger.controller';
import { GuestMessengerService } from './guest-messeneger.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestMessengerController],
  providers: [GuestMessengerService]
})
export class GuestMessengerModule {}
