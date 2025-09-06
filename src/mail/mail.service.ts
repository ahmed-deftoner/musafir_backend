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
        template: 'email-confirmation',
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

  async sendReEvaluateRequestToJury(
    registrationId: string,
    flagshipName: string,
    name: string,
    email: string,
    musafirNumber: string,
    city: string,
  ) {
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

  async sendTripQuery(
    flagshipId: string,
    flagshipName: string,
    name: string,
    email: string,
    musafirNumber: string,
    city: string,
    tripQuery: string,
  ) {
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

  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
    userName: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your 3Musafir Password',
        template: './password-reset',
        context: {
          resetLink: resetLink,
          userName: userName,
        },
      });
    } catch (error) {
      return error;
    }
  }

  async sendAccountCreatedEmail(email: string, firstName: string, loginUrl: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your 3M account is ready',
        template: './account-created',
        context: {
          firstName,
          loginUrl,
        },
      });
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async sendVerificationApprovedEmail(email: string, fullName: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your 3Musafir Account Has Been Verified',
        template: './verification-approved',
        context: {
          fullName: fullName,
        },
      });
      return true;
    } catch (error) {
      console.log('Error sending verification approved email:', error);
      return error;
    }
  }

  async sendVerificationRejectedEmail(email: string, fullName: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your 3Musafir Account Verification Status',
        template: './verification-rejected',
        context: {
          fullName: fullName,
        },
      });
      return true;
    } catch (error) {
      console.log('Error sending verification rejected email:', error);
      return error;
    }
  }

  async sendPaymentApprovedEmail(
    email: string, 
    fullName: string, 
    amount: number, 
    tripName: string, 
    paymentDate: Date
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your 3Musafir Payment Has Been Approved',
        template: './payment-approved',
        context: {
          fullName: fullName,
          amount: amount,
          tripName: tripName,
          paymentDate: paymentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
        },
      });
      return true;
    } catch (error) {
      console.log('Error sending payment approved email:', error);
      return error;
    }
  }

  async sendPaymentRejectedEmail(
    email: string, 
    fullName: string, 
    amount: number, 
    tripName: string, 
    reason?: string
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your 3Musafir Payment Was Not Approved',
        template: './payment-rejected',
        context: {
          fullName: fullName,
          amount: amount,
          tripName: tripName,
          reason: reason || 'Please ensure all payment details are correct and the screenshot is clear.',
        },
      });
      return true;
    } catch (error) {
      console.log('Error sending payment rejected email:', error);
      return error;
    }
  }

  async sendAdminRegistrationNotification(context: {
    registrationId: string;
    flagshipId: string;
    flagshipName: string;
    userName: string;
    userEmail?: string;
    userPhone?: string;
    userCity?: string;
    joiningFromCity?: string;
    tier?: string;
    bedPreference?: string;
    roomSharing?: string;
    groupMembers?: string[];
    expectations?: string;
    tripType?: string;
    price?: number;
    amountDue?: number;
    createdAt?: Date | string;
    startDate?: Date | string;
    endDate?: Date | string;
    destination?: string;
    category?: string;
  }) {
    try {
      const formatDate = (d?: Date | string) =>
        d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined;

      await this.mailerService.sendMail({
        to: process.env.JURY_EMAIL,
        subject: 'New Trip Registration Submitted',
        template: './admin-registration-notification',
        context: {
          ...context,
          createdAt: formatDate(context.createdAt),
          startDate: formatDate(context.startDate),
          endDate: formatDate(context.endDate),
          groupMembers: context.groupMembers && context.groupMembers.length ? context.groupMembers : undefined,
        },
      });
      return true;
    } catch (error) {
      console.log('Error sending admin registration notification:', error);
      return error;
    }
  }
}
