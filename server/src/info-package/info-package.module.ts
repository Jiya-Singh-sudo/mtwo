import { Module } from '@nestjs/common';
import { InfoPackageController } from './info-package.controller';
import { InfoPackageService } from './info-package.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [InfoPackageController],
  providers: [InfoPackageService]
})
export class InfoPackageModule {}
