import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RolesModule } from './roles/roles.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { GuestsController } from './guests/guests.controller';
import { GuestsModule } from './guests/guests.module';
import { DriversModule } from './drivers/drivers.module';
import { MealsModule } from './meals/meals.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [DatabaseModule, RolesModule, VehiclesModule, GuestsModule, DriversModule, MealsModule, RoomsModule],
  controllers: [AppController, GuestsController],
  providers: [AppService],
})
export class AppModule {}
