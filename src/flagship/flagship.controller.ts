import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFlagshipDto } from './dto/create-flagship.dto';
import { UpdateFlagshipDto } from './dto/update-flagship.dto';
import { successResponse } from '../constants/response';
import { FlagshipService } from './flagship.service';

import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { AuthenticatedRequest } from '../user/interfaces/authenticated-request';
import { FlagshipFilterDto } from './dto/get-flagship.dto';
import { Flagship } from './interfaces/flagship.interface';
import { GetUser } from 'src/auth/decorators/user.decorator';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { User } from 'src/user/interfaces/user.interface';

@ApiTags('Flagship')
@Controller('flagship')
export class FlagshipController {
  constructor(private readonly flagshipService: FlagshipService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new flagship trip' })
  @ApiResponse({
    status: 201,
    description: 'Flagship trip created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid data provided.' })
  @ApiBearerAuth()
  async create(
    @Body() createFlagshipDto: CreateFlagshipDto,
    @Req() req: AuthenticatedRequest,
  ) {
    createFlagshipDto.created_By = req.user._id as string;
    const flagShip = await this.flagshipService.create(createFlagshipDto);
    return successResponse(flagShip, 'Flagship Created', 201);
  }

  @Get()
  @ApiOperation({ summary: 'Get all flagships with filtering options' })
  @ApiResponse({
    status: 200,
    description: 'Flagship records',
    type: [Flagship],
  })
  async getFlagships(@Query() filterDto: FlagshipFilterDto): Promise<any> {
    const flagships = await this.flagshipService.getAllFlagships(filterDto);
    return successResponse(flagships, 'Flagship Data', HttpStatus.OK);
  }

  @Get('getByID/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get one flagships' })
  @ApiOkResponse({})
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.flagshipService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'files', maxCount: 10 },
      { name: 'detailedPlanDoc', maxCount: 1 },
    ])
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update flagship pricing details' })
  @ApiResponse({ status: 200, description: 'Flagship updated successfully.' })
  @ApiResponse({ status: 404, description: 'Flagship not found.' })
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateFlagshipDto: UpdateFlagshipDto,
    @UploadedFiles() uploadedFiles: { files?: Express.Multer.File[], detailedPlanDoc?: Express.Multer.File[] },
  ) {
    if (uploadedFiles) {
      if (uploadedFiles.files && uploadedFiles.files.length > 0) {
        updateFlagshipDto.files = uploadedFiles.files;
      }
      if (uploadedFiles.detailedPlanDoc && uploadedFiles.detailedPlanDoc[0]) {
        updateFlagshipDto.detailedPlanDoc = uploadedFiles.detailedPlanDoc[0];
      }
    }

    const flagShip = await this.flagshipService.updateFlagship(
      id,
      updateFlagshipDto,
    );
    return successResponse(flagShip, 'Flagship Updated', HttpStatus.OK);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a flagships' })
  @ApiOkResponse({})
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.flagshipService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/tripQuery')
  async sendTripQuery(
    @GetUser() user: User,
    @Body() tripQuery: any,
  ) {
    return {
      statusCode: 200,
      message: await this.flagshipService.sendTripQuery(tripQuery.query, tripQuery.flagshipId, user),
    }
  }

  @Get('registered/:id')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get registered users for a flagship' })
  @ApiOkResponse({})
  findRegisteredUsers(
    @Param('id') id: string,
    @Query('search') search: string,
  ) {
    return this.flagshipService.findRegisteredUsers(id, search);
  }

  @Get('pending-verification/:id')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pending verification users for a flagship' })
  @ApiOkResponse({})
  findPendingVerificationUsers(@Param('id') id: string) {
    return this.flagshipService.findPendingVerificationUsers(id);
  }

  @Get('paid/:id')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paid users for a flagship' })
  @ApiOkResponse({})
  findPaidUsers(
    @Param('id') id: string,
    @Query('paymentType') paymentType: string,
  ) {
    return this.flagshipService.findPaidUsers(id, paymentType);
  }

  @Get('registeration-stats/:id')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get registeration stats for a flagship' })
  @ApiOkResponse({})
  getRegisterationStats(@Param('id') id: string) {
    return this.flagshipService.getRegisterationStats(id);
  }

  @Get('payment-stats/:id')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment stats for a flagship' })
  @ApiOkResponse({})
  getPaymentStats(@Param('id') id: string) {
    return this.flagshipService.gePaymentStats(id);
  }

  @Get('registration/:id')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get registration by ID' })
  @ApiOkResponse({})
  getRegistrationByID(@Param('id') id: string) {
    return this.flagshipService.getRegistrationByID(id);
  }

  @Patch('approve-registration/:registerationID')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'approve registeration' })
  @ApiOkResponse({})
  approveRegisteration(
    @Param('registerationID') id: string,
    @Body('comment') comment: string,
  ) {
    return this.flagshipService.approveRegisteration(id, comment);
  }

  @Patch('reject-registration/:registerationID')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'reject registeration' })
  @ApiOkResponse({})
  rejectRegisteration(
    @Param('registerationID') id: string,
    @Body('comment') comment: string,
  ) {
    return this.flagshipService.rejectRegisteration(id, comment);
  }

  @Patch('verify-user/:userID')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'verify user' })
  @ApiOkResponse({})
  verifyUser(@Param('userID') id: string, @Body('comment') comment: string) {
    return this.flagshipService.verifyUser(id, comment);
  }

  @Patch('reject-verification/:userID')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'reject registeration' })
  @ApiOkResponse({})
  rejectVerification(
    @Param('userID') id: string,
    @Body('comment') comment: string,
  ) {
    return this.flagshipService.rejectVerification(id, comment);
  }

  @Get('past-trips')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get past trips' })
  @ApiOkResponse({})
  getPastTrips() {
    return this.flagshipService.getPastTrips();
  }

  @Get('live-trips')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get live trips' })
  @ApiOkResponse({})
  getLiveTrips() {
    return this.flagshipService.getLiveTrips();
  }

  @Get('upcoming-trips')
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get upcoming trips' })
  @ApiOkResponse({})
  getUpcomingTrips() {
    return this.flagshipService.getUpcomingTrips();
  }
}
