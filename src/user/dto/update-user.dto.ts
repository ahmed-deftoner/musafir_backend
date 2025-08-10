import {
  IsNotEmpty,
  IsString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Ihtasham Nazir',
    description: 'The name of the User',
    format: 'string',
    minLength: 6,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  readonly fullName?: string;

  @ApiProperty({
    example: '03********7',
    description: 'Phone number of the User',
    format: 'string',
  })
  @IsOptional()
  @IsString()
  readonly phone?: string;

  @ApiProperty({
    example: '33**********5',
    description: 'CNIC of the User',
    format: 'string',
  })
  @IsOptional()
  @IsString()
  readonly cnic?: string;
}
