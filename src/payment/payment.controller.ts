import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  CreateBankAccountDto,
  CreatePaymentDto,
  RequestRefundDto,
} from './dto/payment.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Get('get-user-discount/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get User Discount' })
  @ApiOkResponse({})
  getUserDiscount(@Param('userId') userId: string) {
    return this.paymentService.calculateUserDiscount(userId);
  }

  @Get('get-user-discount-by-registration/:registrationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get User Discount by Registration ID' })
  @ApiOkResponse({})
  getUserDiscountByRegistration(@Param('registrationId') registrationId: string) {
    return this.paymentService.getUserDiscountByRegistrationId(registrationId);
  }

  @Get('get-bank-accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Bank Accounts' })
  @ApiOkResponse({})
  getBankAccounts() {
    return this.paymentService.getBankAccounts();
  }

  @Get('get-payment/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Payment ID' })
  @ApiOkResponse({})
  getPayment(@Param('id') id: string) {
    return this.paymentService.getPayment(id);
  }

  @Get('get-pending-payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Pending Payments' })
  @ApiOkResponse({})
  getPendingPayments() {
    return this.paymentService.getPendingPayments();
  }

  @Get('get-completed-payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Completed Payments' })
  @ApiOkResponse({})
  getCompletedPayments() {
    return this.paymentService.getCompletedPayments();
  }

  @Post('create-bank-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Bank Account' })
  @ApiOkResponse({})
  createBankAccount(@Body() createBankAccountDto: CreateBankAccountDto) {
    return this.paymentService.createBankAccount(createBankAccountDto);
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request Refund' })
  @ApiOkResponse({})
  requestRefund(@Body() requestRefundDto: RequestRefundDto) {
    return this.paymentService.requestRefund(requestRefundDto);
  }

  @Get('get-refunds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Refunds' })
  @ApiOkResponse({})
  getRefunds() {
    return this.paymentService.getRefunds();
  }

  @Patch('approve-refund/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve Refund' })
  @ApiOkResponse({})
  approveRefund(@Param('id') id: string) {
    return this.paymentService.approveRefund(id);
  }

  @Patch('reject-refund/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject Refund' })
  @ApiOkResponse({})
  rejectRefund(@Param('id') id: string) {
    return this.paymentService.rejectRefund(id);
  }

  @Post('create-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Payment' })
  @ApiOkResponse({})
  @UseInterceptors(FileInterceptor('screenshot'))
  createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @UploadedFile() screenshot: Express.Multer.File,
  ) {
    return this.paymentService.createPayment(createPaymentDto, screenshot);
  }

  @Patch('approve-payment/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve Payment' })
  @ApiOkResponse({})
  approvePayment(@Param('id') id: string) {
    return this.paymentService.approvePayment(id);
  }

  @Patch('reject-payment/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject Payment' })
  @ApiOkResponse({})
  rejectPayment(@Param('id') id: string) {
    return this.paymentService.rejectPayment(id);
  }
}
