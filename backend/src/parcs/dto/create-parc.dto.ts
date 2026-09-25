import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateParcDto {
  @ApiProperty({ example: 'Aéroport de Tunis-Carthage' })
  @IsString() @IsNotEmpty() name: string;

  @ApiPropertyOptional({ example: 'Route de l\'Aéroport, Tunis' })
  @IsOptional() @IsString() address?: string;

  @ApiPropertyOptional({ example: 'Tunis' })
  @IsOptional() @IsString() city?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional() @IsNumber() @Min(1) capacity?: number;

  @ApiPropertyOptional({ example: 'Parc principal à l\'aéroport' })
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() isActive?: boolean;
}
