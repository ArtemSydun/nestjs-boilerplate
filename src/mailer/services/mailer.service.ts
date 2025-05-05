import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService as MailService } from '@nestjs-modules/mailer';

import { configServiceKeys } from 'src/common/enums/config.service.enum';

import { DefaultResponse } from 'src/common/interfaces/responses';
import { ContactUsDto } from 'src/user/dto/contact-us.dto';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private readonly mailerService: MailService,
    private readonly configService: ConfigService,
  ) {}

  public getLink(apiUrl: string, route: string, message: string) {
    return `<a href=${apiUrl}/${route}>${message}</a>`;
  }

  public getBottomHtml() {
    const EMAIL_FOOTER = `
   <br>
   <p>'If you did not request this action, please ignore this email.'}</p>
   <br>
   <p>'This link is available only for 15 minutes'}</p>
   `;

    return EMAIL_FOOTER;
  }

  public async contactUs(
    formBody: ContactUsDto,
  ): Promise<DefaultResponse<null>> {
    await this.sendContactForm(formBody);

    return {
      message: `Your email were sent successfully. We will send you a response in 12-48 hours`,
      statusCode: HttpStatus.OK,
    };
  }

  public async sendDistribution(
    sender: string,
    receiver: string,
    distribution: { subject: string; html: string },
  ): Promise<DefaultResponse<null>> {
    try {
      const { subject, html } = distribution;

      await this.mailerService.sendMail({
        to: receiver,
        from: sender,
        subject,
        html,
      });

      this.logger.verbose(`Email sent to ${receiver}, subject: ${subject}}`);

      return { message: 'Mail sent successfully', statusCode: HttpStatus.OK };
    } catch (err) {
      this.logger.error(err.message);
      throw new BadRequestException(err.message);
    }
  }

  public async sendRegistrationLink(
    email: string,
    token: string,
  ): Promise<void> {
    try {
      const confirmationLink = this.getLink(
        this.configService.get(configServiceKeys.FRONTEND_LINK),
        `auth/sign-up/${token}`,
        `Confirm your email`,
      );

      await this.mailerService.sendMail({
        to: email,
        from: this.configService.get<string>('MAILER_SENDER'),
        subject: `Confirm your email`,
        text: `Click the link to reset your password: ${confirmationLink}`,
        html: `<p>
          Please confirm your email by clicking the following link
        ${confirmationLink}</p>`,
      });

      this.logger.verbose(`Registration mail sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  public async sendResetPasswordLink(
    email: string,
    token: string,
  ): Promise<void> {
    try {
      const resetLink = `${this.configService.get(configServiceKeys.FRONTEND_LINK)}/auth/reset-password/${token}`;

      await this.mailerService.sendMail({
        to: email,
        from: this.configService.get<string>('MAILER_SENDER'),
        subject: 'Password Reset Request',
        text: `Click the link to reset your password: ${resetLink}`,
        html:
          `<p>Click the link to reset your password:</p>
              <a href="${resetLink}">RESET PASSWORD</a>
              ` + this.getBottomHtml(),
      });

      this.logger.verbose(`Forgot password mail sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  public async sendChangeEmailLink(
    email: string,
    token: string,
  ): Promise<void> {
    try {
      const emailLink = `${this.configService.get(configServiceKeys.FRONTEND_LINK)}/settings/change-email/${token}`;

      await this.mailerService.sendMail({
        to: email,
        from: this.configService.get<string>('MAILER_SENDER'),
        subject: 'Change Email Request',
        text: `Click the link to change your email: ${emailLink}`,
        html:
          `<p> Click the link to change your email:</p>
              <a href="${emailLink}">CONFIRM EMAIL</a>
              ` + this.getBottomHtml(),
      });

      this.logger.verbose(`Change email link sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  public async sendDeleteProfileLink(
    email: string,
    token: string,
  ): Promise<void> {
    try {
      const emailLink = `${this.configService.get(configServiceKeys.FRONTEND_LINK)}/settings/delete-profile/${token}`;

      await this.mailerService.sendMail({
        to: email,
        from: this.configService.get<string>('MAILER_SENDER'),
        subject: 'Delete profile request',
        text: `Click the link if you are sure that you want to delete your RHT account: ${emailLink}`,
        html:
          `<p>Click the link if you are sure that you want to delete your RHT account:</p>
              <a href="${emailLink}">DELETE ACCOUNT</a>
              ` + this.getBottomHtml(),
      });

      this.logger.verbose(`Delete profile link sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  public async sendContactForm(formBody: ContactUsDto) {
    const { email, subject, message } = formBody;
    try {
      await this.mailerService.sendMail({
        to: this.configService.get(configServiceKeys.ADMIN_MAIL),
        from: this.configService.get(configServiceKeys.MAILER_SENDER),
        replyTo: email,
        subject: `Contact Us: ${email}`,
        text:
          `Message from contact form\n` +
          `Email: ${email}\n` +
          `Subject: ${subject}\n` +
          `Message: ${message}`,
      });

      this.logger.log(`📩 Contact form submitted successfully by ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send contact form: ${error.message}`);
      throw new BadRequestException(
        'Failed to send message. Please try again later.',
      );
    }
  }
}
