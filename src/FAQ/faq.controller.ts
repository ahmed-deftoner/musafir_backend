import {
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
import { FaqService } from './faq.service';

@ApiTags('Faq')
@Controller('faq')
export class FaqController {
  constructor(
    private readonly faqService: FaqService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getFaqByFlagshipId() {
    return {
      statusCode: 200,
      message: "FAQ fetched successfully",
      data: await this.faqService.getFaqByFlagshipId()
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Post('/')
  async createFaq(
    // @Body() faq: CreateFaqDto,
  ) {
    return this.faqService.createFaq();
  }
}