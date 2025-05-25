import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Registration } from './interfaces/registration.interface';
import { User } from 'src/user/interfaces/user.interface';
import { MailService } from 'src/mail/mail.service';
import mongoose from 'mongoose';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectModel('Registration') private readonly registrationModel: Model<Registration>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Flagship') private readonly flagshipModel: Model<any>,
    private readonly mailService: MailService,
  ) { }

  async createRegistration(registration: CreateRegistrationDto): Promise<{ registrationId: string, message: string }> {
    try {
      const user = await this.userModel.findById(registration.userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${registration.userId} not found`);
      }

      const flagship = await this.flagshipModel.findById(registration.flagshipId);
      if (!flagship) {
        throw new NotFoundException(`Flagship with ID ${registration.flagshipId} not found`);
      }

      const newRegistration = new this.registrationModel({
        ...registration,
        user: new mongoose.Types.ObjectId(registration.userId),
        flagship: new mongoose.Types.ObjectId(registration.flagshipId)
      });

      const createdRegistration = await newRegistration.save();
      return {
        registrationId: createdRegistration._id,
        message: "Registration created successfully."
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async getPastPassport(userId: string) {
    try {
      return await this.registrationModel.find({ status: "completed", userId: userId })
        .populate('flagshipId')
        .populate('ratingId')
        .exec();
    } catch (error) {
      throw new Error(`Failed to fetch past passport data: ${error.message}`);
    }
  }

  async getUpcomingPassport(userId: string) {
    try {
      return await this.registrationModel.find({ status: { $ne: "completed" }, userId: userId })
        .populate('flagshipId')
        .exec();
    } catch (error) {
      throw new Error(`Failed to fetch upcoming passport data: ${error.message}`);
    }
  }

  async getRegistrationById(registrationId: string) {
    try {
      if (!registrationId) {
        throw new Error("Registration ID is required");
      }

      return await this.registrationModel.findById(registrationId)
        .populate('flagshipId')
        .exec();
    } catch (error) {
      throw new Error(`Failed to fetch registration data: ${error.message}`);
    }
  }

  async sendReEvaluateRequestToJury(registrationId: string, user: User) {
    const registration = await this.getRegistrationById(registrationId);
    const tripName = typeof registration.flagshipId === 'object' ? registration.flagshipId.tripName : '';
    await this.mailService.sendReEvaluateRequestToJury(registrationId, tripName, user.fullName, user.email, user.phone, user?.city);
    return "Re-evaluate request sent to jury successfully.";
  }
} 
