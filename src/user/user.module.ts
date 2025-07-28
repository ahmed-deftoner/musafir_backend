import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { RegistrationSchema } from '../registration/schemas/registration.schema';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { StorageService } from 'src/storage/storageService';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Registration', schema: RegistrationSchema }
    ]),
    AuthModule,
    MailModule,
  ],
  controllers: [UserController],
  providers: [UserService, StorageService, ConfigService],
  exports: [UserService],
})
export class UserModule { }
