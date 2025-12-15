import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { DesginationModule } from './desgination/designation.module';
import { HousekeepingModule } from './housekeeping/housekeeping.module';
import { UsersModule } from './users/users.module';
import { GuestDriverModule } from './guest-driver/guest-driver.module';
import { GuestButlerModule } from './guest-butler/guest-butler.module';
import { GuestInoutModule } from './guest-inout/guest-inout.module';
import { GuestFoodModule } from './guest-food/guest-food.module';
import { GuestRoomModule } from './guest-room/guest-room.module';
import { GuestNetworkModule } from './guest-network/guest-network.module';
import { GuestHousekeepingModule } from './guest-housekeeping/guest-housekeeping.module';
import { GuestDesignationModule } from './guest-designation/guest-designation.module';
import { AuthModule } from './auth/auth.module';
import { GuestVehicleModule } from './guest_vehicle/guest_vehicle.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    RolesModule,
    VehiclesModule,
    GuestsModule,
    DriversModule,
    MealsModule,
    RoomsModule,
    ButlersModule,
    NetworksModule,
    DesginationModule,
    HousekeepingModule,
    UsersModule,
    GuestDriverModule,
    GuestButlerModule,
    GuestInoutModule,
    GuestFoodModule,
    GuestRoomModule,
    GuestNetworkModule,
    GuestHousekeepingModule,
    GuestDesignationModule,
    AuthModule,
    GuestVehicleModule,
    DashboardModule,
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}
