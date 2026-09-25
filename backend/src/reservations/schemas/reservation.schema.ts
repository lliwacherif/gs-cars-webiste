import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReservationDocument = Reservation & Document;

export enum ReservationStatus {
  RECU      = 'recu',       // received — awaiting admin approval
  PENDING   = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentOption {
  ACOMPTE = 'acompte',   // 10%
  MOITIE = 'moitie',     // 50%
  TOTAL = 'total',       // 100%
}

export enum PaymentStatus {
  PENDING  = 'pending',
  PARTIAL  = 'partial',
  PAID     = 'paid',
  REFUNDED = 'refunded',
}

@Schema({ timestamps: true })
export class Reservation {
  // ── Parties ───────────────────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true })
  vehicle: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  // ── Logistics ─────────────────────────────────────────────────────────────
  @Prop({ required: true, trim: true })
  pickupLocation: string;

  @Prop({ required: true, trim: true })
  dropoffLocation: string;

  @Prop({ required: true })
  pickupDate: Date;

  @Prop({ required: true })
  dropoffDate: Date;

  @Prop({ required: true, min: 18 })
  driverAge: number;

  // ── Duration ──────────────────────────────────────────────────────────────
  @Prop({ required: true, min: 1 })
  totalDays: number;

  // ── Pricing ───────────────────────────────────────────────────────────────
  @Prop({ required: true, min: 0 })
  pricePerDay: number;

  @Prop({ required: true, min: 0 })
  subtotalHT: number;

  @Prop({ required: true, min: 0 })
  tva: number;

  @Prop({ required: true, min: 0 })
  totalTTC: number;

  @Prop({ required: true, min: 0 })
  depositAmount: number;          // caution charged

  // ── Payment ───────────────────────────────────────────────────────────────
  @Prop({ enum: PaymentOption, required: true })
  paymentOption: PaymentOption;

  @Prop({ required: true, min: 0 })
  amountPaid: number;

  @Prop({ min: 0, default: 0 })
  remainingBalance: number;       // totalTTC - amountPaid

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ trim: true })
  paymentMethod?: string;         // cash, card, bank_transfer, etc.

  @Prop({ trim: true })
  paymentReference?: string;      // receipt number, transaction ID, etc.

  // ── Status ────────────────────────────────────────────────────────────────
  @Prop({ enum: ReservationStatus, default: ReservationStatus.RECU })
  status: ReservationStatus;

  // ── Add-ons & notes ───────────────────────────────────────────────────────
  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ trim: true })
  notes?: string;                 // customer notes

  @Prop({ trim: true })
  internalNotes?: string;         // admin-only notes

  // ── Customer preferences ──────────────────────────────────────────────────
  @Prop({ default: true })
  acceptAlternative: boolean;     // accept a similar car if this one is unavailable

  // ── Admin Approval & Custom Down Payment ──────────────────────────────────
  @Prop({ min: 0, max: 100, default: 30 })
  requiredDepositPercentage: number;   // e.g. 30 for 30% down payment required by admin

  @Prop({ min: 0, default: 0 })
  requiredDepositAmount: number;       // calculated totalTTC * (requiredDepositPercentage / 100)

  // ── Lifecycle timestamps ──────────────────────────────────────────────────
  @Prop()
  confirmedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop({ trim: true })
  cancelReason?: string;

  @Prop()
  completedAt?: Date;

  // ── Mileage snapshot ─────────────────────────────────────────────────────
  @Prop({ min: 0 })
  mileageAtPickup?: number;

  @Prop({ min: 0 })
  mileageAtDropoff?: number;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

ReservationSchema.index({ user: 1, status: 1 });
ReservationSchema.index({ vehicle: 1, pickupDate: 1, dropoffDate: 1 });
ReservationSchema.index({ status: 1, pickupDate: 1 });
ReservationSchema.index({ createdAt: -1 });
