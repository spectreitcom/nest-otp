import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailSender } from './ports/email-sender';
import { OtpEmail } from './email/otp.email';
import { SendOtpDto } from './dto/send-otp.dto';

@Controller()
export class EmailServiceController {
  private readonly logger = new Logger(EmailServiceController.name);

  constructor(private readonly emailSender: EmailSender) {}

  @EventPattern('emails.send-otp')
  async handleSendOpt(@Payload() data: SendOtpDto) {
    this.logger.debug('handleSendOpt', data);
    const email = new OtpEmail(data.code);
    await this.emailSender.send(data.email, email);
  }
}
