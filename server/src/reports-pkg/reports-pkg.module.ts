import { Module } from '@nestjs/common';
import { ReportsPkgController } from './reports-pkg.controller';
import { ReportsPkgService } from './reports-pkg.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsPkgController],
  providers: [ReportsPkgService]
})
export class ReportsPkgModule {}
