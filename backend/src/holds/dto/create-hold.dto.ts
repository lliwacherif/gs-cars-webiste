import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId } from 'class-validator';

export class CreateHoldDto {
  @ApiProperty({ example: '6686b3a2c1234abc00000001', description: 'Vehicle ID to hold' })
  @IsMongoId()
  vehicleId: string;

  @ApiProperty({ example: '2025-07-20' })
  @IsDateString()
  pickupDate: string;

  @ApiProperty({ example: '2025-07-27' })
  @IsDateString()
  dropoffDate: string;
}
