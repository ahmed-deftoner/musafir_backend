import { ResetPasswordDto } from './dto/reset-password.dto';
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

@Injectable()
export class UserService {
  HOURS_TO_VERIFY = 4;
  HOURS_TO_BLOCK = 6;
  LOGIN_ATTEMPTS_TO_BLOCK = 5;

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('ForgotPassword')
    private readonly forgotPasswordModel: Model<ForgotPassword>,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly storageService: StorageService,
  ) {}

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
    await this.findByEmail(createForgotPasswordDto.email);
    await this.saveForgotPassword(req, createForgotPasswordDto);
    return {
      email: createForgotPasswordDto.email,
      message: 'verification sent.',
    };
  }

  // Forget Password verify
  async forgotPasswordVerify(req: Request, verifyUuidDto: VerifyUuidDto) {
    const forgotPassword = await this.findForgotPasswordByUuid(verifyUuidDto);
    await this.setForgotPasswordFirstUsed(req, forgotPassword);
    return {
      email: forgotPassword.email,
      message: 'now reset your password.',
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
    const forgotPassword =
      await this.findForgotPasswordByEmail(resetPasswordDto);
    await this.setForgotPasswordFinalUsed(forgotPassword);
    await this.resetUserPassword(resetPasswordDto);
    return {
      email: resetPasswordDto.email,
      message: 'password successfully changed.',
    };
  }

  async setUserVerified(id: string, verifyUser: VerifyUserDto) {
    const user = await this.userModel.findById(id);
    if (verifyUser.referral1 && verifyUser.referral2) {
      user.verification.referralIDs.push(
        verifyUser.referral1,
        verifyUser.referral2,
      );
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
    user.markModified('verification');
    return await user.save();
  }

  findAll(): any {
    return { hello: 'world' };
  }

  async getUserData(user: User): Promise<User> {
    return user;
  }

  async unverifiedUsers() {
    const users = await this.userModel
      .find({
        'verification.status': 'unverified',
      })
      .select('-password -__v')
      .lean();
    return users;
  }

  async verifiedUsers() {
    const users = await this.userModel
      .find({
        'verification.status': 'verified',
      })
      .select('-password -__v')
      .lean();
    return users;
  }

  async pendingVerificationUsers() {
    const users = await this.userModel
      .find({
        'verification.status': 'pending',
      })
      .select('-password -__v')
      .lean();
    return users;
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
    const user = await this.userModel.findOne({ email, emailVerified: true });
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
    const user = await this.userModel.findOne({ email, emailVerified: true });
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

  private async saveForgotPassword(
    req: Request,
    createForgotPasswordDto: CreateForgotPasswordDto,
  ) {
    const forgotPassword = await this.forgotPasswordModel.create({
      email: createForgotPasswordDto.email,
      verification: v4(),
      expires: addHours(new Date(), this.HOURS_TO_VERIFY),
      ip: this.authService.getIp(req),
    });
    await forgotPassword.save();
  }

  private async findForgotPasswordByUuid(
    verifyUuidDto: VerifyUuidDto,
  ): Promise<ForgotPassword> {
    const forgotPassword = await this.forgotPasswordModel.findOne({
      verification: verifyUuidDto.verification,
      firstUsed: false,
      finalUsed: false,
      expires: { $gt: new Date() },
    });
    if (!forgotPassword) {
      throw new BadRequestException('Bad request.');
    }
    return forgotPassword;
  }

  private async setForgotPasswordFirstUsed(
    req: Request,
    forgotPassword: ForgotPassword,
  ) {
    forgotPassword.firstUsed = true;
    forgotPassword.ipChanged = this.authService.getIp(req);
    // forgotPassword.browserChanged = this.authService.getBrowserInfo(req);
    // forgotPassword.countryChanged = this.authService.getCountry(req);
    await forgotPassword.save();
  }

  private async findForgotPasswordByEmail(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ForgotPassword> {
    const forgotPassword = await this.forgotPasswordModel.findOne({
      email: resetPasswordDto.email,
      firstUsed: true,
      finalUsed: false,
      expires: { $gt: new Date() },
    });
    if (!forgotPassword) {
      throw new BadRequestException('Bad request.');
    }
    return forgotPassword;
  }

  private async setForgotPasswordFinalUsed(forgotPassword: ForgotPassword) {
    forgotPassword.finalUsed = true;
    await forgotPassword.save();
  }

  private async resetUserPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userModel.findOne({
      email: resetPasswordDto.email,
      emailVerified: true,
    });
    user.password = resetPasswordDto.password;
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
      return await user.save();
    } catch (error) {
      throw new Error('Failed to upload video: ' + error.message);
    }
  }
}
