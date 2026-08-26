import { BaseEmail } from './types';

export class OtpEmail extends BaseEmail {
  constructor(private readonly code: string) {
    super();
  }

  getData(): { subject: string; body: string } {
    return { subject: 'Your OTP', body: `Your OTP is: ${this.code}` };
  }
}
