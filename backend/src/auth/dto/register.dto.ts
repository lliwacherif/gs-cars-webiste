import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Mohamed', description: 'First name of the user' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Ben Ali', description: 'Last name of the user' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'client@example.com', description: 'Unique email address' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'MyPassword@123',
    description: 'Password — minimum 8 characters',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiPropertyOptional({ example: '+216 98 765 432', description: 'Phone number (optional)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 25, description: 'Driver age (min 18)' })
  @IsNumber()
  @Min(18)
  age: number;
}
