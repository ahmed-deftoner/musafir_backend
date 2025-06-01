import {
  Injectable,
  InternalServerErrorException,
  BadRequestException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faq } from './interfaces/faq.interface';


@Injectable()
export class FaqService {
  constructor(
    @InjectModel('Faq') private readonly faqModel: Model<Faq>,
  ) { }

  async getFaqByFlagshipId(): Promise<Faq[]> {
    try {
      return this.faqModel.find().sort({ createdAt: -1 });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get FAQ. Please try again later,', error.message);
    }
  }

  async createFaq(): Promise<Faq> {
    try {
      const newFaq = new this.faqModel({
        question: 'How much cash should I bring?',
        answer: 'We recommend bringing 20,000 PKR for the trip. This amount will cover your food, accommodation, and other expenses during the trip.',
        flagshipId: '6826fb42b78dddb0d3fab04b'
      });
      return await newFaq.save();
    } catch (error) {
      throw new InternalServerErrorException('Failed to create FAQ. Please try again later,', error.message);
    }
  }
}
