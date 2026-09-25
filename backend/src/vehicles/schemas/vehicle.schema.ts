import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VehicleDocument = Vehicle & Document;

export enum VehicleCategory {
  ECONOMIQUE = 'Économique',
  COMPACTE = 'Compacte',
  BERLINE = 'Berline',
  SUV = 'SUV',
  LUXE = 'Luxe',
  MONOSPACE = 'Monospace',
  UTILITAIRE = 'Utilitaire',
}

export enum VehicleTransmission {
  MANUELLE = 'Manuelle',
  AUTOMATIQUE = 'Automatique',
}

export enum VehicleFuel {
  ESSENCE = 'Essence',
  DIESEL = 'Diesel',
  HYBRIDE = 'Hybride',
  ELECTRIQUE = 'Électrique',
}

export enum VehicleStatus {
  DISPONIBLE = 'Disponible',
  RESERVE = 'Réservé',
  MAINTENANCE = 'Maintenance',
}

@Schema({ _id: false })
class VehicleFeatures {
  @Prop({ default: false }) ac: boolean;
  @Prop({ default: false }) bluetooth: boolean;
  @Prop({ default: false }) radio: boolean;
  @Prop({ default: false }) usb: boolean;
  @Prop({ default: false }) gps: boolean;
  @Prop({ default: false }) cruiseControl: boolean;
  @Prop({ default: false }) parkingSensors: boolean;
  @Prop({ default: false }) camera360: boolean;
  @Prop({ default: false }) sunroof: boolean;
  @Prop({ default: false }) heatedSeats: boolean;
}
const VehicleFeaturesSchema = SchemaFactory.createForClass(VehicleFeatures);

@Schema({ timestamps: true })
export class Vehicle {
  // ── Identity ─────────────────────────────────────────────────────────────
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  brand: string;

  @Prop({ trim: true })
  modelName?: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  plate: string;

  @Prop({ trim: true })
  color?: string;

  @Prop({ required: true, enum: VehicleCategory })
  category: VehicleCategory;

  // ── Technical ─────────────────────────────────────────────────────────────
  @Prop({ required: true, enum: VehicleTransmission })
  transmission: VehicleTransmission;

  @Prop({ required: true, enum: VehicleFuel })
  fuel: VehicleFuel;

  @Prop({ required: true, min: 1, max: 9 })
  seats: number;

  @Prop({ default: 5 })
  doors: number;

  @Prop({ required: true, min: 0 })
  bags: number;

  @Prop({ trim: true })
  engineSize?: string;            // e.g. "1.5L", "2.0 Turbo"

  @Prop({ min: 0 })
  fuelTankCapacity?: number;      // litres

  @Prop({ min: 0 })
  mileage?: number;               // total km on clock

  // ── Pricing ───────────────────────────────────────────────────────────────
  @Prop({ required: true, min: 0 })
  pricePerDay: number;

  @Prop({ min: 0 })
  pricePerWeek?: number;

  @Prop({ min: 0 })
  pricePerMonth?: number;

  @Prop({ min: 0, default: 500 })
  depositAmount: number;          // caution / acompte

  @Prop({ min: 18, default: 21 })
  minDriverAge: number;

  // ── Parc (parking location) ───────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Parc', default: null })
  parc?: Types.ObjectId;

  // ── Multiple parcs (multi-parc assignment) ─────────────────────────────────
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Parc' }], default: [] })
  parcs: Types.ObjectId[];

  // ── Media ─────────────────────────────────────────────────────────────────
  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ trim: true })
  model3dUrl?: string;

  @Prop({ type: VehicleFeaturesSchema, default: {} })
  features: VehicleFeatures;

  // ── Status ────────────────────────────────────────────────────────────────
  @Prop({ enum: VehicleStatus, default: VehicleStatus.DISPONIBLE })
  status: VehicleStatus;

  @Prop({ default: true })
  isActive: boolean;

  // ── Maintenance history ───────────────────────────────────────────────────
  @Prop()
  lastMaintenanceDate?: Date;

  @Prop({ trim: true })
  maintenanceNotes?: string;

  @Prop()
  nextMaintenanceDate?: Date;

  // ── Acquisition ───────────────────────────────────────────────────────────
  @Prop()
  acquisitionDate?: Date;

  @Prop({ min: 0 })
  acquisitionCost?: number;       // purchase price in TND

  // ── Misc ─────────────────────────────────────────────────────────────────
  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];                 // searchable tags e.g. ["famille", "confort"]
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

VehicleSchema.index({ category: 1, status: 1, pricePerDay: 1 });
VehicleSchema.index({ isActive: 1 });
VehicleSchema.index({ brand: 1 });
