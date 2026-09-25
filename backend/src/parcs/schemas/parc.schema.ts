import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ParcDocument = Parc & Document;

@Schema({ timestamps: true })
export class Parc {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ min: 1, default: 50 })
  capacity: number;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ParcSchema = SchemaFactory.createForClass(Parc);
