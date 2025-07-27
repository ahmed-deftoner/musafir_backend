import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'pejman@gmail.com',
    description: 'The email of the User',
    format: 'email',
    uniqueItems: true,
    minLength: 5,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    example: 'oldpassword123',
    description: 'The previous password of the User',
    format: 'string',
    minLength: 5,
    maxLength: 1024,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1024)
  readonly previousPassword: string;

  @ApiProperty({
    example: 'secret password change me!',
    description: 'The new password of the User',
    format: 'string',
    minLength: 5,
    maxLength: 1024,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1024)
  readonly password: string;

  @ApiProperty({
    example: 'secret password change me!',
    description: 'Confirm the new password of the User',
    format: 'string',
    minLength: 5,
    maxLength: 1024,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1024)
  readonly confirmPassword: string;
}

export class JwtResetPasswordDto {
  @ApiProperty({
    example: 'secret password change me!',
    description: 'The new password of the User',
    format: 'string',
    minLength: 5,
    maxLength: 1024,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1024)
  readonly password: string;

  @ApiProperty({
    example: 'secret password change me!',
    description: 'Confirm the new password of the User',
    format: 'string',
    minLength: 5,
    maxLength: 1024,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1024)
  readonly confirmPassword: string;
}
