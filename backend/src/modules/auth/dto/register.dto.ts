import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'john.doe@orderflow.com', description: 'Email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password (min 8 chars, must contain uppercase, lowercase, number)' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.EXECUTOR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
