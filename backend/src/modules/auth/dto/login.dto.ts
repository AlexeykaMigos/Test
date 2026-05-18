import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@orderflow.com', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'User password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
