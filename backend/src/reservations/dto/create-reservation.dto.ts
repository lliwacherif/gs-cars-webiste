import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsEmail, IsEnum, IsMongoId,
  IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min,
  ValidateNested,
} from 'class-validator';
import { PaymentOption } from '../schemas/reservation.schema';

export class GuestContactDto {
  @ApiProperty({ example: 'Sami Ben Ali' })
  @IsString() @IsNotEmpty() @MaxLength(160)
  fullName: string;

  @ApiProperty({ example: '+216 20 123 456' })
  @IsString() @Matches(/^[0-9+().\-\s]{6,30}$/, { message: 'phone must be a valid phone number' })
  phone: string;

  @ApiPropertyOptional({ example: 'sami@example.com' })
  @IsOptional() @IsEmail() @MaxLength(254)
  email?: string;
}

export class CreateReservationDto {
  @ApiProperty({ example: '6686b3a2c1234abc00000001', description: 'MongoDB ObjectId of the vehicle to book' })
  @IsMongoId()
  vehicleId: string;

  @ApiProperty({ example: 'Aéroport de Tunis-Carthage', description: 'Pick-up location' })
  @IsString() @IsNotEmpty() @MaxLength(120)
  pickupLocation: string;

  @ApiProperty({ example: 'Aéroport de Tunis-Carthage', description: 'Drop-off location' })
  @IsString() @IsNotEmpty() @MaxLength(120)
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

  @ApiPropertyOptional({
    enum: PaymentOption,
    example: PaymentOption.ACOMPTE,
    description: 'Payment split: acompte (10%) | moitie (50%) | total (100%)',
  })
  @IsOptional() @IsEnum(PaymentOption)
  paymentOption?: PaymentOption;

  @ApiPropertyOptional({
    type: [String],
    example: ['Siège bébé', 'GPS'],
    description: 'Optional add-ons requested',
  })
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(80, { each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'Livraison à l\'hôtel svp.', description: 'Free-text notes for the agency' })
  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ example: true, description: 'Accept a similar vehicle if this one is unavailable', default: true })
  @IsOptional() @IsBoolean()
  acceptAlternative?: boolean;

  @ApiPropertyOptional({ example: '6686b3a2c1234abc00000099', description: 'Hold ID to release after booking is created' })
  @IsOptional() @IsMongoId()
  holdId?: string;

  @ApiPropertyOptional({
    type: GuestContactDto,
    description: 'Required only when reserving without an account',
  })
  @IsOptional() @ValidateNested() @Type(() => GuestContactDto)
  guestContact?: GuestContactDto;
}
