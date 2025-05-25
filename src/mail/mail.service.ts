import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmailVerification(emailto: string, password: string) {
    try {
      await this.mailerService.sendMail({
        to: emailto,
        subject: 'Verify Your 3Musafir Account',
        template: './email-confirmation',
        context: {
          password: password,
        },
      });
      return true;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async sendReEvaluateRequestToJury(registrationId: string, flagshipName: string, name: string, email: string, musafirNumber: string, city: string) {
    try {
      await this.mailerService.sendMail({
        to: process.env.JURY_EMAIL,
        subject: 'Re-Evaluate Request to Jury',
        template: './askJuryToReEvaluate',
        context: {
          registrationId: registrationId,
          flagshipName: flagshipName,
          name: name,
          email: email,
          musafirNumber: musafirNumber,
          city: city,
        },
      });
    } catch (error) {
      return error;
    }
  }

  async sendTripQuery(flagshipId: string, flagshipName: string, name: string, email: string, musafirNumber: string, city: string, tripQuery: string) {
    try {
      await this.mailerService.sendMail({
        to: process.env.JURY_EMAIL,
        subject: 'Trip Query',
        template: './tripQuery',
        context: {
          flagshipId: flagshipId,
          flagshipName: flagshipName,
          name: name,
          email: email,
          musafirNumber: musafirNumber,
          city: city,
          tripQuery: tripQuery,
        },
      });
    } catch (error) {
      return error;
    }
  }
}
