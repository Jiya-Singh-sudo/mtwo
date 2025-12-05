import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
