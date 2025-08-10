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
import { StorageService } from 'src/storage/storageService';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectModel('Registration') private readonly registrationModel: Model<Registration>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Flagship') private readonly flagshipModel: Model<any>,
    private readonly storageService: StorageService,
    private readonly mailService: MailService,
  ) { }

  async createRegistration(registration: CreateRegistrationDto, userId: string): Promise<{ registrationId: string, message: string }> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const flagship = await this.flagshipModel.findById(registration.flagshipId);
      if (!flagship) {
        throw new NotFoundException(`Flagship with ID ${registration.flagshipId} not found`);
      }

      const newRegistration = new this.registrationModel({
        ...registration,
        amountDue: registration.price,
        userId: userId,
        user: user,
        flagship: new mongoose.Types.ObjectId(registration.flagshipId)
      });

      const createdRegistration = await newRegistration.save();

      
      try {
        const populatedRegistration = await this.registrationModel
          .findById(createdRegistration._id)
          .populate('user')
          .populate('flagship')
          .exec();

        const reg: any = populatedRegistration;
        const regUser = reg?.user;
        const regFlagship = reg?.flagship;

        await this.mailService.sendAdminRegistrationNotification({
          registrationId: String(createdRegistration._id),
          flagshipId: String(registration.flagshipId),
          flagshipName: regFlagship?.tripName,
          userName: regUser?.fullName || 'Musafir',
          userEmail: regUser?.email,
          userPhone: regUser?.phone,
          userCity: regUser?.city,
          joiningFromCity: registration.joiningFromCity,
          tier: registration.tier,
          bedPreference: registration.bedPreference,
          roomSharing: registration.roomSharing,
          groupMembers: registration.groupMembers,
          expectations: registration.expectations,
          tripType: registration.tripType,
          price: registration.price,
          amountDue: registration.price,
          createdAt: createdRegistration.createdAt,
          startDate: regFlagship?.startDate,
          endDate: regFlagship?.endDate,
          destination: regFlagship?.destination,
          category: regFlagship?.category,
        });
      } catch (e) {
        console.log('Failed to send admin registration notification:', e);
      }

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
      return await this.registrationModel.find({
        status: { $in: ["completed", "refunded"] },
        userId: userId
      })
        .populate('flagshipId')
        .populate('ratingId')
        .exec();
    } catch (error) {
      throw new Error(`Failed to fetch past passport data: ${error.message}`);
    }
  }

  async getUpcomingPassport(userId: string) {
    try {
      const registrations = await this.registrationModel.find({
        status: { $nin: ["completed", "refunded"] },
        userId: userId
      })
        .populate('flagship')
        .exec();

      return await Promise.all(
        registrations.map(async (registration) => {
          if (registration.flagship.images && registration.flagship.images.length > 0) {
            const imageUrls = await Promise.all(
              registration.flagship.images.map(async (imageKey) => {
                return await this.storageService.getSignedUrl(imageKey);
              }),
            );
            registration.flagship.images = imageUrls;
          }

          if (registration.flagship.detailedPlan) {
            registration.flagship.detailedPlan = await this.storageService.getSignedUrl(
              registration.flagship.detailedPlan,
            );
          }
          return registration;
        }));
    } catch (error) {
      throw new Error(`Failed to fetch upcoming passport data: ${error.message}`);
    }
  }

  async getRegistrationById(registrationId: string) {
    try {
      if (!registrationId) {
        throw new Error("Registration ID is required");
      }

      const registration = await this.registrationModel.findById(registrationId)
        .populate('flagship')
        .populate('user')
        .exec();

      if (registration.flagship.images.length > 0) {
        registration.flagship.images = await Promise.all(
          registration.flagship.images.map(async (imageKey) => {
            return await this.storageService.getSignedUrl(imageKey);
          })
        )
      }

      return registration;
    } catch (error) {
      throw new Error(`Failed to fetch registration data: ${error.message}`);
    }
  }



  async sendReEvaluateRequestToJury(registrationId: string, user: User) {
    try {
      const registration = await this.getRegistrationById(registrationId);
      const tripName = typeof registration.flagshipId === 'object' ? registration.flagshipId.tripName : '';
      await this.mailService.sendReEvaluateRequestToJury(registrationId, tripName, user.fullName, user.email, user.phone, user?.city);
      return "Re-evaluate request sent to jury successfully.";

    } catch (error) {
      throw new Error(`Failed to send the re-evalute request to jury: ${error.message}`);
    }
  }
} 
