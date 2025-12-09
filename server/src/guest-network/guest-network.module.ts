import { Module } from '@nestjs/common';
import { GuestNetworkController } from './guest-network.controller';
import { GuestNetworkService } from './guest-network.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GuestNetworkController],
  providers: [GuestNetworkService]
})
export class GuestNetworkModule {}
