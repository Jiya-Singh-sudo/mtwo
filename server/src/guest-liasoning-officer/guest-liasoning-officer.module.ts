import { Module } from '@nestjs/common';
import { GuestLiasoningOfficerController } from './guest-liasoning-officer.controller';
import { GuestLiasoningOfficerService } from './guest-liasoning-officer.service';
import { DatabaseModule } from 'src/database/database.module';
@Module({
  imports: [DatabaseModule],
  controllers: [GuestLiasoningOfficerController],
  providers: [GuestLiasoningOfficerService]
})
export class GuestLiasoningOfficerModule {}
