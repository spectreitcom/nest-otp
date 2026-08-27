import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OtpRequestCommand } from '../commands/otp-request.command';
import { OtpGenerator } from '../ports/otp-generator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { randomUUID } from 'node:crypto';
import { OtpStore } from '../ports/otp-store';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { EMAIL_SERVICE } from '../../constants';

@CommandHandler(OtpRequestCommand)
export class OtpRequestCommandHandler implements ICommandHandler<
  OtpRequestCommand,
  string
> {
  constructor(
    private readonly otpGenerator: OtpGenerator,
    private readonly prismaService: PrismaService,
    private readonly otpStore: OtpStore,
    private readonly configService: ConfigService,
    @Inject(EMAIL_SERVICE) private readonly emailService: ClientProxy,
  ) {}

  async execute(command: OtpRequestCommand): Promise<string> {
    const { email } = command;

    await this.checkIfUserExist(email);

    const code = this.otpGenerator.generate();
    const challengeId = randomUUID();

    const hashedOtp = this.otpGenerator.hashOtp(
      challengeId,
      code,
      this.configService.getOrThrow<string>('OTP_SECRET'),
    );

    await this.otpStore.create({
      email,
      codeHash: hashedOtp,
      challengeId,
    });

    this.emailService.emit<{ email: string; code: string }>('emails.send-otp', {
      email,
      code,
    });

    return challengeId;
  }

  private async checkIfUserExist(email: string) {
    const record = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!record) {
      throw new Error('Email already exist');
    }
  }
}
