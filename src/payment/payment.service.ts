import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankAccount, Payment } from './interface/payment.interface';
import {
  CreateBankAccountDto,
  CreatePaymentDto,
  RequestRefundDto,
} from './dto/payment.dto';
import { StorageService } from 'src/storage/storageService';
import { User } from 'src/user/interfaces/user.interface';
import { Flagship } from 'src/flagship/interfaces/flagship.interface';
import { Refund } from './schema/refund.schema';
import { Registration } from 'src/registration/interfaces/registration.interface';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel('Payment')
    private readonly paymentModel: Model<Payment>,
    @InjectModel('User')
    private readonly user: Model<User>,
    @InjectModel('BankAccount')
    private readonly bankAccountModel: Model<BankAccount>,
    @InjectModel('Flagship')
    private readonly flagshipModel: Model<Flagship>,
    @InjectModel('Registration')
    private readonly registrationModel: Model<Registration>,
    @InjectModel('Refund')
    private readonly refundModel: Model<Refund>,
    private readonly storageService: StorageService,
  ) { }

  async getBankAccounts(): Promise<BankAccount[]> {
    return this.bankAccountModel.find();
  }

  async getRefunds(): Promise<Refund[]> {
    return this.refundModel
      .find()
      .populate({
        path: 'registration',
        populate: [
          { path: 'user' },
          { path: 'flagship' },
          { path: 'payment' }
        ],
      })
      .exec();
  }

  async getPayment(id: string): Promise<Payment> {
    const payment = await this.paymentModel
      .findById(id)
      .populate({
        path: 'registration',
        populate: [{ path: 'user' }, { path: 'flagship' }],
      })
      .populate('bankAccount')
      .exec();

    if (payment) {
      const screenshotUrl = await this.storageService.getSignedUrl(
        payment._id.toString(),
      );
      payment.screenshot = screenshotUrl;
    }

    return payment;
  }

  async createBankAccount(
    createBankAccountDto: CreateBankAccountDto,
  ): Promise<BankAccount> {
    const bankAccount = new this.bankAccountModel(createBankAccountDto);
    return bankAccount.save();
  }

  async requestRefund(requestRefundDto: RequestRefundDto): Promise<Refund> {
    const refund = new this.refundModel(requestRefundDto);

    const registration = await this.registrationModel.findById(requestRefundDto.registration);
    if (registration) {
      registration.status = "refundProcessing";
      await registration.save();
    }
    return refund.save();
  }

  async createPayment(
    createPaymentDto: CreatePaymentDto,
    screenshot: Express.Multer.File,
  ): Promise<Payment> {
    const payment = new this.paymentModel(createPaymentDto);
    const savedPayment = await payment.save();

    if (savedPayment && savedPayment._id) {
      const screenshotUrl = await this.storageService.uploadFile(
        savedPayment._id.toString(),
        screenshot.buffer,
        screenshot.mimetype,
      );
      savedPayment.screenshot = screenshotUrl;
      await savedPayment.save();

      // Update registration with payment ID if registration exists
      if (createPaymentDto.registration) {
        const registration = await this.registrationModel.findById(createPaymentDto.registration);
        if (registration) {
          await this.registrationModel.findByIdAndUpdate(
            createPaymentDto.registration,
            {
              paymentId: savedPayment._id,
              isPaid: true,
            },
          );
        }
      }
    }

    return savedPayment;
  }

  async approvePayment(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true },
    );

    if (payment && payment.registration) {
      const registration = await this.registrationModel.findById(payment.registration);

      await this.registrationModel.findByIdAndUpdate(payment.registration, {
        isPaid: true,
        amountDue: registration.amountDue - payment.amount,
        status: 'confirmed',
      });
    }

    return payment;
  }

  async rejectPayment(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true },
    );

    if (payment && payment.registration) {
      await this.registrationModel.findByIdAndUpdate(payment.registration, {
        isPaid: false,
        paymentId: null,
      });
    }

    return payment;
  }

  async getPendingPayments(): Promise<Payment[]> {
    return this.paymentModel
      .find({ status: 'pendingApproval' })
      .populate({
        path: 'registration',
        populate: [{ path: 'user' }, { path: 'flagship' }],
      })
      .populate('bankAccount')
      .exec();
  }

  async getCompletedPayments(): Promise<Payment[]> {
    return this.paymentModel
      .find({ status: 'approved' })
      .populate({
        path: 'registration',
        populate: [{ path: 'user' }, { path: 'flagship' }],
      })
      .populate('bankAccount')
      .exec();
  }

  async approveRefund(id: string): Promise<Refund> {
    return this.refundModel.findByIdAndUpdate(id, { status: 'cleared' });
  }

  async rejectRefund(id: string): Promise<Refund> {
    return this.refundModel.findByIdAndUpdate(id, { status: 'rejected' });
  }
}
