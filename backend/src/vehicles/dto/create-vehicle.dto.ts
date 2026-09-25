import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString,
  IsBoolean, IsArray, IsDateString, Min, Max, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleCategory, VehicleFuel, VehicleTransmission, VehicleStatus } from '../schemas/vehicle.schema';

class CreateVehicleFeaturesDto {
  @IsOptional() @IsBoolean() ac?: boolean;
  @IsOptional() @IsBoolean() bluetooth?: boolean;
  @IsOptional() @IsBoolean() radio?: boolean;
  @IsOptional() @IsBoolean() usb?: boolean;
  @IsOptional() @IsBoolean() gps?: boolean;
  @IsOptional() @IsBoolean() cruiseControl?: boolean;
  @IsOptional() @IsBoolean() parkingSensors?: boolean;
  @IsOptional() @IsBoolean() camera360?: boolean;
  @IsOptional() @IsBoolean() sunroof?: boolean;
  @IsOptional() @IsBoolean() heatedSeats?: boolean;
}

export class CreateVehicleDto {
  // ── Identity ───────────────────────────────────────────────────────────
  @ApiProperty({ example: 'Renault Clio 5' })
  @IsString() @IsNotEmpty() name: string;

  @ApiProperty({ example: 'Renault' })
  @IsString() @IsNotEmpty() brand: string;

  @ApiPropertyOptional({ example: 'Clio 5' })
  @IsOptional() @IsString() modelName?: string;

  @ApiProperty({ example: 2023 })
  @IsNumber() @Min(1990) @Max(2030) year: number;

  @ApiProperty({ example: 'TU-456-RC' })
  @IsString() @IsNotEmpty() plate: string;

  @ApiPropertyOptional({ example: 'Gris Platine' })
  @IsOptional() @IsString() color?: string;

  @ApiProperty({ enum: VehicleCategory, example: VehicleCategory.ECONOMIQUE })
  @IsEnum(VehicleCategory) category: VehicleCategory;

  // ── Technical ──────────────────────────────────────────────────────────
  @ApiProperty({ enum: VehicleTransmission, example: VehicleTransmission.MANUELLE })
  @IsEnum(VehicleTransmission) transmission: VehicleTransmission;

  @ApiProperty({ enum: VehicleFuel, example: VehicleFuel.ESSENCE })
  @IsEnum(VehicleFuel) fuel: VehicleFuel;

  @ApiProperty({ example: 5 })
  @IsNumber() @Min(1) @Max(9) seats: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional() @IsNumber() @Min(2) @Max(6) doors?: number;

  @ApiProperty({ example: 2 })
  @IsNumber() @Min(0) bags: number;

  @ApiPropertyOptional({ example: '1.5 dCi' })
  @IsOptional() @IsString() engineSize?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional() @IsNumber() @Min(0) fuelTankCapacity?: number;

  @ApiPropertyOptional({ example: 32000 })
  @IsOptional() @IsNumber() @Min(0) mileage?: number;

  // ── Pricing ────────────────────────────────────────────────────────────
  @ApiProperty({ example: 26 })
  @IsNumber() @Min(1) pricePerDay: number;

  @ApiPropertyOptional({ example: 160 })
  @IsOptional() @IsNumber() @Min(0) pricePerWeek?: number;

  @ApiPropertyOptional({ example: 580 })
  @IsOptional() @IsNumber() @Min(0) pricePerMonth?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional() @IsNumber() @Min(0) depositAmount?: number;

  @ApiPropertyOptional({ example: '64abc...', description: 'Parc (parking location) ID' })
  @IsOptional() @IsString() parcId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Array of Parc IDs for multi-parc assignment' })
  @IsOptional() @IsArray() @IsString({ each: true }) parcIds?: string[];

  @ApiPropertyOptional({ example: 21 })
  @IsOptional() @IsNumber() @Min(18) minDriverAge?: number;

  // ── Media ──────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../car.glb' })
  @IsOptional() @IsString() model3dUrl?: string;

  @ApiPropertyOptional({ type: () => CreateVehicleFeaturesDto })
  @IsOptional() @ValidateNested() @Type(() => CreateVehicleFeaturesDto)
  features?: CreateVehicleFeaturesDto;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional() @IsEnum(VehicleStatus) status?: VehicleStatus;

  // ── Maintenance ────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: '2024-03-01' })
  @IsOptional() @IsDateString() lastMaintenanceDate?: string;

  @ApiPropertyOptional({ example: '2025-03-01' })
  @IsOptional() @IsDateString() nextMaintenanceDate?: string;

  @ApiPropertyOptional({ example: 'Vidange + filtres' })
  @IsOptional() @IsString() maintenanceNotes?: string;

  // ── Acquisition ────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: '2022-06-15' })
  @IsOptional() @IsDateString() acquisitionDate?: string;

  @ApiPropertyOptional({ example: 28000 })
  @IsOptional() @IsNumber() @Min(0) acquisitionCost?: number;

  // ── Misc ───────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Citadine économique idéale pour la ville.' })
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ type: [String], example: ['famille', 'confort'] })
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @ApiPropertyOptional({ example: true, description: 'Whether the vehicle is visible on the public site' })
  @IsOptional() @IsBoolean() isActive?: boolean;
}
