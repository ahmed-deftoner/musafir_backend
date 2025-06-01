import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegistrationSchema } from './schemas/registration.schema';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { MailModule } from '../mail/mail.module';
import { UserSchema } from '../user/schemas/user.schema';
import { FlagshipSchema } from '../flagship/schemas/flagship.schema';
import { ConfigService } from '@nestjs/config';
import { StorageService } from 'src/storage/storageService';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Registration', schema: RegistrationSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Flagship', schema: FlagshipSchema },
    ]),
    MailModule,
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService, StorageService, ConfigService],
  exports: [RegistrationService],
})
export class RegistrationModule { }
