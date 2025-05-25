import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RatingService } from './rating.service';

@ApiTags('Rating')
@Controller('rating')
export class RatingController {
  constructor(
    private readonly ratingService: RatingService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('/top-five')
  async getTopFiveRating(
  ) {
    return {
      statusCode: 200,
      message: "Top 5 Rating fetched successfully",
      data: await this.ratingService.getTopFiveRating()
    }
  }
}