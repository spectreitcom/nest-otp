import { Injectable, Logger } from '@nestjs/common';
import { EmailSender } from '../application/ports/email-sender';
import { BaseEmail } from '../application/email/types';

@Injectable()
export class ConsoleEmailSender implements EmailSender {
  private readonly logger = new Logger(ConsoleEmailSender.name);

  send(recipientEmail: string, email: BaseEmail): Promise<void> | void {
    this.logger.debug('send', recipientEmail, email.getData());
  }
}
