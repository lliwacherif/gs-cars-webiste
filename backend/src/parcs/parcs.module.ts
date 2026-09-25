import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParcsService } from './parcs.service';
import { ParcsController } from './parcs.controller';
import { Parc, ParcSchema } from './schemas/parc.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Parc.name, schema: ParcSchema }])],
  controllers: [ParcsController],
  providers: [ParcsService],
  exports: [ParcsService],
})
export class ParcsModule {}
