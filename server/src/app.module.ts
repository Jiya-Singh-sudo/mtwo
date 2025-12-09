import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RolesModule } from './roles/roles.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { GuestsModule } from './guests/guests.module';
import { DriversModule } from './drivers/drivers.module';
import { MealsModule } from './meals/meals.module';
import { RoomsModule } from './rooms/rooms.module';
import { ButlersModule } from './butlers/butlers.module';
import { NetworksModule } from './networks/networks.module';

@Module({
  imports: [
    DatabaseModule,
    RolesModule,
    VehiclesModule,
    GuestsModule,
    DriversModule,
    MealsModule,
    RoomsModule,
    ButlersModule,
    NetworksModule,
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}
