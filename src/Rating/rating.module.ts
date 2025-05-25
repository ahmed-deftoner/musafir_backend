import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RatingSchema } from './schemas/rating.schema';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Rating', schema: RatingSchema }]),
  ],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
