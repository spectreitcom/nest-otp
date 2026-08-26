import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerifyOtpCommand } from '../commands/verify-otp.command';
import { OtpStore } from '../ports/otp-store';
import { OtpGenerator } from '../ports/otp-generator';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../ports/token.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { randomUUID } from 'node:crypto';
import { RefreshTokenStorage } from '../ports/refresh-token-storage';

export type VerifyOtpCommandResponse = {
  accessToken: string;
  refreshToken: string;
};

@CommandHandler(VerifyOtpCommand)
export class VerifyOtpCommandHandler implements ICommandHandler<
  VerifyOtpCommand,
  VerifyOtpCommandResponse
> {
  constructor(
    private readonly otpStore: OtpStore,
    private readonly otpGenerator: OtpGenerator,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
    private readonly refreshTokenStorage: RefreshTokenStorage,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<VerifyOtpCommandResponse> {
    const { code, challengeId } = command;

    const otpChallenge = await this.otpStore.get(challengeId);

    if (!otpChallenge) {
      throw new Error('OTP challenge not found');
    }

    await this.otpStore.incrementAttempts(challengeId);

    const hashed = this.otpGenerator.hashOtp(
      challengeId,
      code,
      this.configService.getOrThrow<string>('OTP_SECRET'),
    );

    if (otpChallenge.codeHash !== hashed) {
      throw new Error('Invalid OTP code');
    }

    if (otpChallenge.attempts > 5) {
      throw new Error('Too many attempts');
    }

    const user = await this.prismaService.user.findUnique({
      where: { email: otpChallenge.email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = this.tokenService.createAccessToken(user.id);

    const refreshTokenId = randomUUID();
    const refreshToken = this.tokenService.createRefreshToken(
      user.id,
      refreshTokenId,
    );

    await this.refreshTokenStorage.insert(user.id, refreshTokenId);

    return {
      accessToken,
      refreshToken,
    };
  }
}
