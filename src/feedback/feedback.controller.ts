import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/createFeedback.dto';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('/:registrationId')
  async createFeedback(
    @Param('registrationId') registrationId: string,
    @Body() feedback: CreateFeedbackDto,
  ) {
    return {
      statusCode: 200,
      message: "Feedback submitted successfully",
      data: await this.feedbackService.createFeedback(feedback, registrationId)
    }
  }
}