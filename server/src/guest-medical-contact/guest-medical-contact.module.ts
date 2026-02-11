import { Module } from '@nestjs/common';
import { GuestMedicalContactController } from './guest-medical-contact.controller';
import { GuestMedicalContactService } from './guest-medical-contact.service';
import { DatabaseModule } from 'src/database/database.module';
@Module({
  imports: [DatabaseModule],
  controllers: [GuestMedicalContactController],
  providers: [GuestMedicalContactService]
})
export class GuestMedicalContactModule {}
