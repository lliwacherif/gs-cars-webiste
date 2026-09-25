import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ReservationStatus, PaymentStatus } from '../schemas/reservation.schema';

export class UpdateReservationStatusDto {
  @ApiProperty({ enum: ReservationStatus, example: ReservationStatus.CONFIRMED })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @ApiPropertyOptional({ example: 'Confirmed after payment.' })
  @IsOptional() @IsString()
  notes?: string;

  /** Admin-only internal note (not shown to customer) */
  @ApiPropertyOptional({ example: 'Client a payé en espèces.' })
  @IsOptional() @IsString()
  internalNotes?: string;

  /** Reason for cancellation, required when status = cancelled */
  @ApiPropertyOptional({ example: 'Client a annulé par téléphone.' })
  @IsOptional() @IsString()
  cancelReason?: string;

  /** Mileage recorded at pickup */
  @ApiPropertyOptional({ example: 32500 })
  @IsOptional() @IsNumber() @Min(0)
  mileageAtPickup?: number;

  /** Mileage recorded at dropoff */
  @ApiPropertyOptional({ example: 33200 })
  @IsOptional() @IsNumber() @Min(0)
  mileageAtDropoff?: number;

  /** Payment amount recorded */
  @ApiPropertyOptional({ example: 150 })
  @IsOptional() @IsNumber() @Min(0)
  amountPaid?: number;

  /** Payment status (pending, partial, paid, refunded) */
  @ApiPropertyOptional({ enum: PaymentStatus, example: PaymentStatus.PAID })
  @IsOptional() @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  /** Payment method (cash, card, bank_transfer, etc.) */
  @ApiPropertyOptional({ example: 'espèces' })
  @IsOptional() @IsString()
  paymentMethod?: string;

  /** Payment reference or notes */
  @ApiPropertyOptional({ example: 'Reçu #12345' })
  @IsOptional() @IsString()
  paymentReference?: string;

  /** Admin-specified required down payment percentage (e.g. 10, 30, 50, 100) */
  @ApiPropertyOptional({ example: 30 })
  @IsOptional() @IsNumber() @Min(0)
  requiredDepositPercentage?: number;

  /** Admin-specified required down payment amount */
  @ApiPropertyOptional({ example: 45 })
  @IsOptional() @IsNumber() @Min(0)
  requiredDepositAmount?: number;
}
