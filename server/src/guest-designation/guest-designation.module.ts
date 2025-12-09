import { Module } from '@nestjs/common';
import { GuestDesignationController } from './guest-designation.controller';
import { GuestDesignationService } from './guest-designation.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestDesignationController],
  providers: [GuestDesignationService]
})
export class GuestDesignationModule {}
