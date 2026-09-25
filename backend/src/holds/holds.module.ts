import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hold, HoldSchema } from './schemas/hold.schema';
import { HoldsService } from './holds.service';
import { HoldsController } from './holds.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Hold.name, schema: HoldSchema }]),
  ],
  providers: [HoldsService],
  controllers: [HoldsController],
  exports: [HoldsService], // so ReservationsModule can import it
})
export class HoldsModule {}
