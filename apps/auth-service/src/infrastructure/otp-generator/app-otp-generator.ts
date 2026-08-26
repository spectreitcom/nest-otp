import { Injectable } from '@nestjs/common';
import { OtpGenerator } from '../../appliacation/ports/otp-generator';
import { randomInt, createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppOtpGenerator implements OtpGenerator {
  constructor(private readonly configService: ConfigService) {}

  generate(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  hashOtp(challengeId: string, code: string, secret: string): string {
    return createHmac('sha256', secret)
      .update(`${challengeId}:${code}`)
      .digest('hex');
  }
}
