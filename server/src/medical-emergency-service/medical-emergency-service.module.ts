import { Module } from '@nestjs/common';
import { MedicalEmergencyServiceController } from './medical-emergency-service.controller';
import { MedicalEmergencyServiceService } from './medical-emergency-service.service';
import { DatabaseModule } from '../database/database.module';
@Module({
  imports: [DatabaseModule],
  controllers: [MedicalEmergencyServiceController],
  providers: [MedicalEmergencyServiceService]
})
export class MedicalEmergencyServiceModule {}
