import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsBoolean, IsDateString, IsEnum, IsMongoId,
  IsNotEmpty, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { PaymentOption } from '../schemas/reservation.schema';

export class CreateReservationDto {
  @ApiProperty({ example: '6686b3a2c1234abc00000001', description: 'MongoDB ObjectId of the vehicle to book' })
  @IsMongoId()
  vehicleId: string;

  @ApiProperty({ example: 'Aéroport de Tunis-Carthage', description: 'Pick-up location' })
  @IsString() @IsNotEmpty()
  pickupLocation: string;

  @ApiProperty({ example: 'Aéroport de Tunis-Carthage', description: 'Drop-off location' })
  @IsString() @IsNotEmpty()
  dropoffLocation: string;

  @ApiProperty({ example: '2025-07-20', description: 'Pick-up date (ISO 8601 date string)' })
  @IsDateString()
  pickupDate: string;

  @ApiProperty({ example: '2025-07-27', description: 'Drop-off date — must be after pickupDate' })
  @IsDateString()
  dropoffDate: string;

  @ApiProperty({ example: 30, minimum: 18, description: 'Age of the primary driver (min 18)' })
  @IsNumber() @Min(18)
  driverAge: number;

  @ApiProperty({
    enum: PaymentOption,
    example: PaymentOption.ACOMPTE,
    description: 'Payment split: acompte (10%) | moitie (50%) | total (100%)',
  })
  @IsEnum(PaymentOption)
  paymentOption: PaymentOption;

  @ApiPropertyOptional({
    type: [String],
    example: ['Siège bébé', 'GPS'],
    description: 'Optional add-ons requested',
  })
  @IsOptional() @IsArray() @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'Livraison à l\'hôtel svp.', description: 'Free-text notes for the agency' })
  @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true, description: 'Accept a similar vehicle if this one is unavailable', default: true })
  @IsOptional() @IsBoolean()
  acceptAlternative?: boolean;

  @ApiPropertyOptional({ example: '6686b3a2c1234abc00000099', description: 'Hold ID to release after booking is created' })
  @IsOptional() @IsMongoId()
  holdId?: string;
}
