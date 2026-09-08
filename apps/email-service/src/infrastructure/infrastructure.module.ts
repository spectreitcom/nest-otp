import { Module } from '@nestjs/common';
import { EmailSender } from '../application/ports/email-sender';
import { ConsoleEmailSender } from './console-email-sender';

@Module({
  providers: [
    {
      provide: EmailSender,
      useClass: ConsoleEmailSender,
    },
  ],
  exports: [EmailSender],
})
export class InfrastructureModule {}
