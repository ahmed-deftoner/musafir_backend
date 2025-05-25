import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({
    example: 'Bank of America',
    description: 'Name of the bank',
  })
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Account number',
  })
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @ApiProperty({
    example: '1234567890',
    description: 'IBAN',
  })
  @IsNotEmpty()
  @IsString()
  IBAN: string;
}

export type PaymentType = 'partialPayment' | 'fullPayment';

export class CreatePaymentDto {
  @ApiProperty({
    example: '1234567890',
    description: 'Bank Account ID',
  })
  @IsNotEmpty()
  @IsString()
  bankAccount: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Registration ID',
  })
  @IsNotEmpty()
  @IsString()
  registration: string;

  @ApiProperty({
    example: 'partialPayment',
    description: 'Payment Type',
  })
  @IsNotEmpty()
  @IsString()
  paymentType: PaymentType;

  @ApiProperty({
    example: 100,
    description: 'Amount',
  })
  @Type(() => Number)
  @IsNumber()
  amount: number;
}

export class RequestRefundDto {
  @ApiProperty({
    example: '1234567890',
    description: 'Registration ID',
  })
  @IsNotEmpty()
  @IsString()
  registration: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Bank Details',
  })
  @IsNotEmpty()
  @IsString()
  bankDetails: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Reason',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Feedback',
  })
  @IsNotEmpty()
  @IsString()
  feedback: string;

  @ApiProperty({
    example: 5,
    description: 'Rating',
  })
  @IsNotEmpty()
  @IsNumber()
  rating: number;
}
