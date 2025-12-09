import { Module } from '@nestjs/common';
import { ButlersController } from './butlers.controller';
import { ButlersService } from './butlers.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ButlersController],
  providers: [ButlersService]
})
export class ButlersModule {}
