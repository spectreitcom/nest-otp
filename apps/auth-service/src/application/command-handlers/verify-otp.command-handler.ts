import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerifyOtpCommand } from '../commands/verify-otp.command';
import { OtpStore } from '../ports/otp-store';
import { OtpGenerator } from '../ports/otp-generator';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../ports/token.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { randomUUID } from 'node:crypto';
import { RefreshTokenStorage } from '../ports/refresh-token-storage';
import { IServiceResponse } from '@app/shared';
import { InvalidOtp, TooManyAttempts, UserNotFound } from '../exceptions';

@CommandHandler(VerifyOtpCommand)
export class VerifyOtpCommandHandler implements ICommandHandler<
  VerifyOtpCommand,
  IServiceResponse<{ accessToken: string; refreshToken: string }>
> {
  constructor(
    private readonly otpStore: OtpStore,
    private readonly otpGenerator: OtpGenerator,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
    private readonly refreshTokenStorage: RefreshTokenStorage,
  ) {}

  async execute(
    command: VerifyOtpCommand,
  ): Promise<IServiceResponse<{ accessToken: string; refreshToken: string }>> {
    const { code, challengeId } = command;

    const otpChallenge = await this.otpStore.get(challengeId);

    if (!otpChallenge) {
      throw new InvalidOtp('OTP challenge not found or expired');
    }

    await this.otpStore.incrementAttempts(challengeId);

    const hashed = this.otpGenerator.hashOtp(
      challengeId,
      code,
      this.configService.getOrThrow<string>('OTP_SECRET'),
    );

    if (otpChallenge.codeHash !== hashed) {
      throw new InvalidOtp('Invalid OTP code');
    }

    if (otpChallenge.attempts > 5) {
      throw new TooManyAttempts('Too many attempts');
    }

    const user = await this.prismaService.user.findUnique({
      where: { email: otpChallenge.email },
    });

    if (!user) {
      throw new UserNotFound('User not found');
    }

    const accessToken = this.tokenService.createAccessToken(user.id);

    const refreshTokenId = randomUUID();
    const refreshToken = this.tokenService.createRefreshToken(
      user.id,
      refreshTokenId,
    );

    await this.refreshTokenStorage.insert(user.id, refreshTokenId);

    return {
      hasError: false,
      data: {
        accessToken,
        refreshToken,
      },
    };
  }
}
