import { Module } from '@nestjs/common';
import { GuestButlerController } from './guest-butler.controller';
import { GuestButlerService } from './guest-butler.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestButlerController],
  providers: [GuestButlerService]
})
export class GuestButlerModule {}
