import { BaseEmail } from '../email/types';

export abstract class EmailSender {
  abstract send(recipientEmail: string, email: BaseEmail): Promise<void> | void;
}
