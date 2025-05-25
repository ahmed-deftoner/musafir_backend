import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { FlagshipModule } from './flagship/flagship.module';
import { TripModule } from './trip/trip.module';
import { APP_GUARD } from '@nestjs/core';
import { PermissionGuard } from './auth/guards/permission.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { RegistrationModule } from './registration/registration.module';
import { FeedbackModule } from './feedback/feedback.module';
import { FaqModule } from './FAQ/faq.module';
import { RatingModule } from './Rating/rating.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    UserModule,
    AuthModule,
    PaymentModule,
    FlagshipModule,
    RegistrationModule,
    TripModule,
    FeedbackModule,
    FaqModule,
    RatingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
