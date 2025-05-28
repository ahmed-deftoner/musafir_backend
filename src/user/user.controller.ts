import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { Request } from 'express';
import { LoginUserDto } from './dto/login-user.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CreateGoogleUserDto } from './dto/create-user.dto';
import { VerifyUuidDto } from './dto/verify-uuid.dto';
import { UserService } from './user.service';
import { RefreshAccessTokenDto } from './dto/refresh-access-token.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Auth } from '../auth/decorators/auth.decorator';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { VerifyUserDto } from './dto/verify-user.dto';
import { AuthenticatedRequest } from './interfaces/authenticated-request';
import { errorResponse, successResponse } from '../constants/response';
import { GetUser } from '../auth/decorators/user.decorator';
import { User } from './interfaces/user.interface';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register user' })
  @ApiCreatedResponse({})
  async register(@Body() createUserDto: any) {
    return await this.userService.create(createUserDto);
  }

  @Post('google')
  async googleLogin(
    @Req() req: Request,
    @Body() body: { email: string; googleId: string; fullName: string },
  ) {
    return await this.userService.createEmailUser(body, req);
  }

  @Post('create')
  async googleUserCreate(
    @Req() req: Request,
    @Body() createUserDto: CreateGoogleUserDto,
  ) {
    return this.userService.createGoogleUser(createUserDto, req);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Email' })
  @ApiOkResponse({})
  async verifyEmail(@Req() req: Request) {
    const password = req.body.password;
    const verificationId = req.body.verificationId;
    return await this.userService.verifyEmail(req, password, verificationId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login User' })
  @ApiOkResponse({})
  async login(@Req() req: Request, @Body() loginUserDto: LoginUserDto) {
    return await this.userService.login(req, loginUserDto);
  }

  @Post('refresh-access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Refresh Access Token with refresh token' })
  @ApiCreatedResponse({})
  async refreshAccessToken(
    @Body() refreshAccessTokenDto: RefreshAccessTokenDto,
  ) {
    return await this.userService.refreshAccessToken(refreshAccessTokenDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forgot password' })
  @ApiOkResponse({})
  async forgotPassword(
    @Req() req: Request,
    @Body() createForgotPasswordDto: CreateForgotPasswordDto,
  ) {
    return await this.userService.forgotPassword(req, createForgotPasswordDto);
  }

  @Post('forgot-password-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verfiy forget password code' })
  @ApiOkResponse({})
  async forgotPasswordVerify(
    @Req() req: Request,
    @Body() verifyUuidDto: VerifyUuidDto,
  ) {
    return await this.userService.forgotPasswordVerify(req, verifyUuidDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password after verify reset password' })
  @ApiBearerAuth()
  @ApiOkResponse({})
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.userService.resetPassword(resetPasswordDto);
  }

  @Post('request-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('video'))
  @ApiOperation({
    summary:
      'Request user verification by refferal code, video link or request a call',
  })
  @ApiBearerAuth()
  @ApiOkResponse({})
  async requestVerifyUser(
    @Body() verifyDto: VerifyUserDto,
    @UploadedFile() video: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    try {
      const user = req.user;
      if (verifyDto.referral1 && verifyDto.referral2) {
        const user1 = await this.userService.findByReferralId(
          verifyDto.referral1,
        );
        const user2 = await this.userService.findByReferralId(
          verifyDto.referral2,
        );
        if (user1 && user2) {
          await this.userService.setUserVerified(user._id as string, verifyDto);
        }
        return successResponse({}, 'User verified successfully', 200);
      }

      if (video) {
        const videoUrl = await this.userService.uploadVerificationVideo(video, user._id as string);
        return successResponse(videoUrl, 'Video uploaded successfully', 200);
      }

      if (verifyDto.videoUrl || verifyDto.requestCall || video) {
        const res = await this.userService.requestVerification(
          user._id as string,
          verifyDto,
        );
        return successResponse(res, 'Verification Requested', 200);
      }

      return errorResponse('Unable to Verify User');
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('verify-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get verified user' })
  @ApiBearerAuth()
  @ApiOkResponse({})
  async getVerifyUser(@Req() req: AuthenticatedRequest): Promise<any> {
    try {
      const user = req.user;

      return successResponse(user, 'Verified User', 200);
    } catch (error) {
      return errorResponse(error);
    }
  }

  @Get('data')
  // @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'A private route for check the auth' })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({})
  findAll(@Req() req: Request) {
    return this.userService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getUserData(@GetUser() user: User) {
    return {
      statusCode: 200,
      message: 'User data fetched successfully',
      data: await this.userService.getUserData(user),
    };
  }

  @Get('unverified-users')
  // @Roles('admin')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Unverified Users' })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({})
  UnverifiedUsers() {
    return this.userService.unverifiedUsers();
  }

  @Get('verified-users')
  // @Roles('admin')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Verified Users' })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({})
  VerifiedUsers() {
    return this.userService.verifiedUsers();
  }

  @Get('pending-verification-users')
  // @Roles('admin')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Pending Verification Users' })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({})
  PendingVerificationUsers() {
    return this.userService.pendingVerificationUsers();
  }

  @Get('user-details/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get User by ID' })
  @ApiOkResponse({})
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Patch('approve/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve User' })
  @ApiOkResponse({})
  approveUser(@Param('id') id: string) {
    return this.userService.approveUser(id);
  }

  @Patch('reject/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject User' })
  @ApiOkResponse({})
  rejectUser(@Param('id') id: string) {
    return this.userService.rejectUser(id);
  }
}
