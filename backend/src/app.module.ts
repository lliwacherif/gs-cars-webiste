import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ReservationsModule } from './reservations/reservations.module';
import { UploadModule } from './upload/upload.module';
import { HoldsModule } from './holds/holds.module';
import { ParcsModule } from './parcs/parcs.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    // ── Config (loads .env) ──────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // ── MongoDB ──────────────────────────────────────────────────────────
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongoUri'),
      }),
    }),

    // ── Feature Modules ──────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    VehiclesModule,
    ReservationsModule,
    UploadModule,
    HoldsModule,
    ParcsModule,
    MailModule,
  ],
})
export class AppModule {}
