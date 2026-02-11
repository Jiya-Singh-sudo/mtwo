import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LiasoningOfficerController } from './liasoning-officer.controller';
import { LiasoningOfficerService } from './liasoning-officer.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LiasoningOfficerController],
  providers: [LiasoningOfficerService]
})
export class LiasoningOfficerModule { }
