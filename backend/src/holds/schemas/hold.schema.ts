import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HoldDocument = Hold & Document;

@Schema({ timestamps: true })
export class Hold {
  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true, index: true })
  vehicle: Types.ObjectId;

  /** The user who placed the hold (may be null for unauthenticated holds) */
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  user: Types.ObjectId | null;

  @Prop({ required: true })
  pickupDate: Date;

  @Prop({ required: true })
  dropoffDate: Date;

  /**
   * TTL index: MongoDB will automatically delete this document after
   * HOLD_TTL_SECONDS from the createdAt timestamp (default: 10 minutes).
   * The index is defined programmatically below so the TTL value is
   * controlled via the environment variable HOLD_TTL_SECONDS.
   */
  @Prop({ default: Date.now })
  expiresAt: Date;
}

export const HoldSchema = SchemaFactory.createForClass(Hold);

// TTL index: auto-delete when expiresAt is reached
HoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast conflict look-up
HoldSchema.index({ vehicle: 1, pickupDate: 1, dropoffDate: 1 });
