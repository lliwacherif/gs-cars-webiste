import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VehicleCategory, VehicleFuel, VehicleTransmission, VehicleStatus } from '../schemas/vehicle.schema';

export class QueryVehicleDto {
  @IsOptional() @IsEnum(VehicleCategory) category?: VehicleCategory;
  @IsOptional() @IsEnum(VehicleTransmission) transmission?: VehicleTransmission;
  @IsOptional() @IsEnum(VehicleFuel) fuel?: VehicleFuel;
  @IsOptional() @IsEnum(VehicleStatus) status?: VehicleStatus;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) seats?: number;

  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() ac?: boolean;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() gps?: boolean;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(50) limit?: number = 10;

  @IsOptional() @IsString() sortBy?: string = 'pricePerDay';
  @IsOptional() @IsString() sortOrder?: 'asc' | 'desc' = 'asc';

  /** Availability window — exclude vehicles booked during this range */
  @IsOptional() @IsDateString() pickupDate?: string;
  @IsOptional() @IsDateString() dropoffDate?: string;

  /** Filter out cars whose minDriverAge > driverAge */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(18) driverAge?: number;

  /** Filter by parc (parking location) ObjectId */
  @IsOptional() @IsString() parcId?: string;
}
