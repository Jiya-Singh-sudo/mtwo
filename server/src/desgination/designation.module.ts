import { Module } from '@nestjs/common';
import { DesignationController } from './designation.controller';
import { DesignationService } from './designation.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DesignationController],
  providers: [DesignationService]
})
export class DesginationModule {}
