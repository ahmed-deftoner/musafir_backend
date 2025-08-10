import {
  ResetPasswordDto,
  JwtResetPasswordDto,
} from './dto/reset-password.dto';
import { Request } from 'express';
import { AuthService } from './../auth/auth.service';
import { MailService } from './../mail/mail.service';
import { LoginUserDto } from './dto/login-user.dto';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 } from 'uuid';
import { addHours } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { CreateGoogleUserDto, EmailUserDto } from './dto/create-user.dto';
import { VerifyUuidDto } from './dto/verify-uuid.dto';
import { RefreshAccessTokenDto } from './dto/refresh-access-token.dto';
import { ForgotPassword } from './interfaces/forgot-password.interface';
import { User } from './interfaces/user.interface';
import { ObjectId } from 'bson';
import { generateRandomPassword, generateUniqueCode } from 'src/util';
import { VerifyUserDto } from './dto/verify-user.dto';
import { StorageService } from '../storage/storageService';
import * as jwt from 'jsonwebtoken';
import { Registration } from '../registration/interfaces/registration.interface';

@Injectable()
export class UserService {
  HOURS_TO_BLOCK = 6;
  LOGIN_ATTEMPTS_TO_BLOCK = 5;

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Registration') private readonly registrationModel: Model<Registration>,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
  ) { }

  // Create User
  async create(
    createUserDto: any,
  ): Promise<{ userId: any; verificationId: string }> {
    createUserDto.password = generateRandomPassword();
    const user = new this.userModel(createUserDto);
    await this.isEmailUnique(user.email);
    user.referralID = generateUniqueCode();
    user.verification.verificationID = v4();
    user.verification.status = 'unverified';
    const password = createUserDto.password;
    await this.mailService.sendEmailVerification(user.email, password);
    const savedUser = await user.save();
    return {
      userId: savedUser._id,
      verificationId: savedUser.verification.verificationID,
    };
  }

  // Create Email User
  async createEmailUser(userDto: EmailUserDto, req: Request) {
    let user = await this.userModel.findOne({ email: userDto.email });
    if (!user) {
      user = new this.userModel(userDto);
      await this.isEmailUnique(user.email);
      user.referralID = generateUniqueCode();
      user.emailVerified = true;
      user.verification.verificationID = v4();
      user.verification.status = 'unverified';
      await user.save();
    }
    return {
      user,
      email: user.email,
      accessToken: await this.authService.createAccessToken(String(user._id)),
      refreshToken: await this.authService.createRefreshToken(req, user._id),
    };
  }

  // Create Google Users
  async createGoogleUser(userDto: CreateGoogleUserDto, req: Request) {
    let user = await this.userModel.findOne({ email: userDto.email });
    if (!user) {
      user = new this.userModel(userDto);
      await this.isEmailUnique(user.email);
      user.referralID = generateUniqueCode();
      user.emailVerified = true;
      user.verification.verificationID = v4();
      user.verification.status = 'unverified';
      await user.save();
    }
    return {
      user,
      accessToken: await this.authService.createAccessToken(String(user._id)),
      refreshToken: await this.authService.createRefreshToken(req, user._id),
    };
  }

  // Create Google Users
  async createToken(user: { email: string; googleId: string }, req: Request) {
    return {
      email: user.email,
      accessToken: await this.authService.createAccessToken(
        String(user.googleId),
      ),
    };
  }

  // Verify Email
  async verifyEmail(req: Request, password: string, verificationId: string) {
    const user = await this.findByVerification(verificationId);
    await this.checkPassword(password, user);
    await this.setUserAsVerified(user);

    return {
      fullName: user.fullName,
      email: user.email,
      accessToken: await this.authService.createAccessToken(String(user._id)),
      refreshToken: await this.authService.createRefreshToken(req, user._id),
    };
  }

  // Login
  async login(req: Request, loginUserDto: LoginUserDto) {
    const user = await this.findUserByEmail(loginUserDto.email);
    await this.checkPassword(loginUserDto.password, user);
    return {
      user,
      fullName: user.fullName,
      email: user.email,
      accessToken: await this.authService.createAccessToken(String(user._id)),
      refreshToken: await this.authService.createRefreshToken(req, user._id),
    };
  }

  // Find user by email or phone
  async findUserByEmailOrPhone(emailOrPhone: string) {
    const user = await this.userModel.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phone: emailOrPhone }
      ]
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has password (existing user)
    if (user.password) {
      throw new ConflictException('Account already exists. Please login.');
    }

    // Get user's registrations to find trips
    const registrations = await this.registrationModel.find({ userId: user._id })
      .populate('flagshipId', 'tripName')
      .exec();

    const trips = registrations
      .map(reg => {
        const flagship = reg.flagshipId as any;
        return flagship?.tripName;
      })
      .filter(Boolean);

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        city: user.city || 'Unknown'
      },
      trips
    };
  }

  // Verify musafir email and generate password
  async verifyMusafirEmail(email: string, updateExisting?: boolean, userId?: string) {
    let user;

    if (updateExisting && userId) {
      // Update existing user's email
      user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if the new email is already taken by another user
      const existingUserWithEmail = await this.userModel.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId } // Exclude current user
      });

      if (existingUserWithEmail) {
        throw new ConflictException('Email is already taken by another user');
      }

      // Update the user's email
      user.email = email.toLowerCase();
    } else {
      // Find existing user
      user = await this.userModel.findOne({ email: email.toLowerCase() });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user already has password
      if (user.password) {
        throw new ConflictException('Account already exists. Please login.');
      }
    }

    // Generate new password
    const newPassword = generateRandomPassword();
    user.password = newPassword;
    user.emailVerified = true;
    user.verification.status = 'verified';

    await user.save();

    // Send email with password
    await this.mailService.sendEmailVerification(user.email, newPassword);

    return {
      message: 'Password sent to your email',
      email: user.email
    };
  }

  // Refresh Access Token
  async refreshAccessToken(refreshAccessTokenDto: RefreshAccessTokenDto) {
    const userId = await this.authService.findRefreshToken(
      refreshAccessTokenDto.refreshToken,
    );
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('Bad request');
    }
    return {
      accessToken: await this.authService.createAccessToken(String(user._id)),
    };
  }

  // Forget Password
  async forgotPassword(
    req: Request,
    createForgotPasswordDto: CreateForgotPasswordDto,
  ) {
    const user = await this.findByEmail(createForgotPasswordDto.email);

    // Generate JWT token with 15 minutes expiry
    const resetToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        type: 'password_reset',
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

    // Create reset link with frontend URL
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email with reset link
    await this.mailService.sendPasswordResetEmail(
      user.email,
      resetLink,
      user.fullName || 'User',
    );

    return {
      email: createForgotPasswordDto.email,
      message: 'Password reset link sent to your email.',
    };
  }

  async findByReferralId(refferal: string): Promise<User> {
    const user = await this.userModel.findOne({
      referralID: refferal,
      'verification.status': 'verified',
    });
    if (!user) {
      throw new BadRequestException('Bad request.');
    }
    return user;
  }

  // Reset Password
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // Find the user
    const user = await this.userModel.findOne({
      email: resetPasswordDto.email,
      emailVerified: true,
    });
    if (!user) {
      throw new BadRequestException('User not found or not verified.');
    }

    // Check previous password
    const isPrevPasswordCorrect = await bcrypt.compare(
      resetPasswordDto.previousPassword,
      user.password,
    );
    if (!isPrevPasswordCorrect) {
      throw new BadRequestException('Previous password is incorrect.');
    }

    // Check new password and confirm password match
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match.',
      );
    }

    // Prevent reusing the same password
    const isSameAsOld = await bcrypt.compare(
      resetPasswordDto.password,
      user.password,
    );
    if (isSameAsOld) {
      throw new BadRequestException(
        'New password must be different from the previous password.',
      );
    }

    await this.resetUserPassword(user, resetPasswordDto.password);
    return {
      email: resetPasswordDto.email,
      message: 'password successfully changed.',
    };
  }

  // JWT-based Reset Password
  async resetPasswordWithJwt(
    token: string,
    jwtResetPasswordDto: JwtResetPasswordDto,
  ) {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

      if (decoded.type !== 'password_reset') {
        throw new BadRequestException('Invalid token type.');
      }

      // Find user
      const user = await this.userModel.findById(decoded.userId);
      if (!user) {
        throw new BadRequestException('User not found.');
      }

      // Check if passwords match
      if (
        jwtResetPasswordDto.password !== jwtResetPasswordDto.confirmPassword
      ) {
        throw new BadRequestException(
          'New password and confirm password do not match.',
        );
      }

      // Update password
      await this.resetUserPassword(user, jwtResetPasswordDto.password);

      return {
        email: user.email,
        message: 'Password successfully changed.',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'Reset link has expired. Please request a new one.',
        );
      } else if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid reset link.');
      }
      throw error;
    }
  }

  async setUserVerified(id: string, verifyUser: VerifyUserDto) {
    const user = await this.userModel.findById(id);
    if (verifyUser.referral1 && verifyUser.referral2) {
      user.verification.referralIDs = [
        verifyUser.referral1,
        verifyUser.referral2,
      ];
    }
    user.verification.status = 'verified';
    user.verification.verificationDate = new Date();
    user.markModified('verification');
    return await user.save();
  }

  async requestVerification(id: string, verifyUser: VerifyUserDto) {
    const user = await this.userModel.findById(id);
    if (verifyUser.requestCall === 'true') {
      user.verification.RequestCall = true;
    }
    if (verifyUser.videoUrl) {
      user.verification.videoLink = verifyUser.videoUrl;
    }
    user.verification.VerificationRequestDate = new Date();
    user.verification.status = 'pending';
    user.markModified('verification');
    return await user.save();
  }

  findAll(): any {
    return { hello: 'world' };
  }

  async getUserData(user: User): Promise<User> {
    return user;
  }

  async unverifiedUsers(search?: string) {
    const query: any = {
      'verification.status': 'unverified',
      roles: { $ne: 'admin' },
    };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { fullName: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const users = await this.userModel
      .find(query)
      .select('-password -__v')
      .lean();
    return users;
  }

  async verifiedUsers(search?: string) {
    const query: any = {
      'verification.status': 'verified',
      roles: { $ne: 'admin' },
    };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { fullName: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const users = await this.userModel
      .find(query)
      .select('-password -__v')
      .lean();
    return users;
  }

  async pendingVerificationUsers(search?: string) {
    const query: any = {
      'verification.status': 'pending',
      roles: { $ne: 'admin' },
    };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { fullName: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const users = await this.userModel
      .find(query)
      .select('-password -__v')
      .lean();
    return users;
  }

  async searchAllUsers(search: string) {
    if (!search) {
      return {
        unverified: [],
        pendingVerification: [],
        verified: [],
      };
    }

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {
      roles: { $ne: 'admin' },
      $or: [
        { fullName: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ],
    };

    const allUsers = await this.userModel
      .find(query)
      .select('-password -__v')
      .lean();

    const groupedUsers = {
      unverified: allUsers.filter(user => user.verification.status === 'unverified'),
      pendingVerification: allUsers.filter(user => user.verification.status === 'pending'),
      verified: allUsers.filter(user => user.verification.status === 'verified'),
    };

    return groupedUsers;
  }

  async checkEmailAvailability(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required.');
    }

    const user = await this.userModel.findOne({ email });
    if (user) {
      return false;
    }
    return true;
  }

  // ********* Private Methods ******

  /**
   * Create an object composed of the picked object properties
   * @param {Object} object
   * @param {string[]} keys
   * @returns {Object}
   */
  pick(object: { [x: string]: any }, keys: any[]): object {
    return keys.reduce((obj: { [x: string]: any }, key: string | number) => {
      if (object && Object.prototype.hasOwnProperty.call(object, key)) {
        obj[key] = object[key];
      }
      return obj;
    }, {});
  }

  private async getUser(userId: string): Promise<User> {
    const user = await this.userModel.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new BadRequestException('No user found');
    }
    return user;
  }

  private async isEmailUnique(email: string) {
    const user = await this.userModel.findOne({ email, emailVerified: true });
    if (user) {
      throw new BadRequestException('Email already existss.');
    }
  }

  private buildRegistrationInfo(user): any {
    const userRegistrationInfo = {
      fullName: user.fullName,
      email: user.email,
      verified: user.verified,
    };
    return userRegistrationInfo;
  }

  private async findByVerification(verification: string): Promise<User> {
    const user = await this.userModel.findOne({
      'verification.verificationID': verification,
      'verification.status': 'unverified',
    });
    if (!user) {
      throw new BadRequestException('Bad request.');
    }
    return user;
  }

  private async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Email not found.');
    }
    return user;
  }

  private async setUserAsVerified(user: User) {
    user.emailVerified = true;
    await user.save();
  }

  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('Wrong email or password.');
    }
    return user;
  }

  private async checkPassword(attemptPass: string, user) {
    const match = await bcrypt.compare(attemptPass, user.password);
    if (!match) {
      await this.passwordsDoNotMatch(user);
      throw new NotFoundException('Wrong email or password.');
    }
    return match;
  }

  private isUserBlocked(user) {
    if (user.blockExpires > Date.now()) {
      throw new ConflictException('User has been blocked try later.');
    }
  }

  private async passwordsDoNotMatch(user) {
    user.loginAttempts += 1;
    await user.save();
    if (user.loginAttempts >= this.LOGIN_ATTEMPTS_TO_BLOCK) {
      await this.blockUser(user);
      throw new ConflictException('User blocked.');
    }
  }

  private async blockUser(user) {
    user.blockExpires = addHours(new Date(), this.HOURS_TO_BLOCK);
    await user.save();
  }

  private async passwordsAreMatch(user) {
    user.loginAttempts = 0;
    await user.save();
  }

  private async resetUserPassword(user, newPassword: string) {
    user.password = newPassword;
    await user.save();
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async approveUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userModel.findByIdAndUpdate(userId, {
      'verification.status': 'verified',
    });
  }

  async rejectUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userModel.findByIdAndUpdate(userId, {
      'verification.status': 'rejected',
    });
  }

  async uploadVerificationVideo(
    video: Express.Multer.File,
    userId: string,
  ): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const videoKey = `verification-videos/${userId}/${Date.now()}-${video.originalname}`;
      await this.storageService.uploadFile(
        videoKey,
        video.buffer,
        video.mimetype,
      );
      user.verification.videoStorageKey = videoKey;
      user.verification.status = 'pending';
      return await user.save();
    } catch (error) {
      throw new Error('Failed to upload video: ' + error.message);
    }
  }
}
