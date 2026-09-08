import { VerifyOtpCommandHandler } from '../verify-otp.command-handler';
import { OtpChallenge, OtpStore } from '../../ports/otp-store';
import { OtpGenerator } from '../../ports/otp-generator';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../ports/token.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RefreshTokenStorage } from '../../ports/refresh-token-storage';
import { VerifyOtpCommand } from '../../commands/verify-otp.command';
import { InvalidOtp, TooManyAttempts, UserNotFound } from '../../exceptions';

jest.mock('../../../../generated/prisma/client', () => ({
  PrismaClient: class {},
}));

describe('VerifyOtpCommandHandler', () => {
  let handler: VerifyOtpCommandHandler;
  let otpStore: {
    get: jest.Mock;
    incrementAttempts: jest.Mock;
  };

  let otpGenerator: {
    hashOtp: jest.Mock;
  };

  let configService: {
    getOrThrow: jest.Mock;
  };

  let tokenService: {
    createAccessToken: jest.Mock;
    createRefreshToken: jest.Mock;
  };

  let prismaService: {
    user: {
      findUnique: jest.Mock;
    };
  };

  let refreshTokenStorage: {
    insert: jest.Mock;
  };

  const OTP_SECRET = 'super-secret-key';

  beforeEach(() => {
    otpStore = {
      get: jest.fn(),
      incrementAttempts: jest.fn(),
    };

    otpGenerator = {
      hashOtp: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn().mockReturnValue(OTP_SECRET),
    };

    tokenService = {
      createAccessToken: jest.fn(),
      createRefreshToken: jest.fn(),
    };

    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    refreshTokenStorage = {
      insert: jest.fn(),
    };

    handler = new VerifyOtpCommandHandler(
      otpStore as unknown as OtpStore,
      otpGenerator as unknown as OtpGenerator,
      configService as unknown as ConfigService,
      tokenService as unknown as TokenService,
      prismaService as unknown as PrismaService,
      refreshTokenStorage as unknown as RefreshTokenStorage,
    );
  });

  it('should verify otp and return authentication tokens', async () => {
    // Given
    const challengeId = 'challenge-123';
    const code = '123456';
    const codeHash = 'valid-code-hash';
    const userId = 'user-uuid-123';
    const email = 'test@example.com';
    const accessToken = 'access.jwt.token';
    const refreshToken = 'refresh.jwt.token';

    const command = new VerifyOtpCommand(challengeId, code);
    const otpChallenge: OtpChallenge = {
      email,
      attempts: 0,
      createdAt: Date.now(),
      codeHash,
    };

    otpStore.get.mockResolvedValue(otpChallenge);
    otpGenerator.hashOtp.mockReturnValue(codeHash);
    prismaService.user.findUnique.mockResolvedValue({
      id: userId,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tokenService.createAccessToken.mockReturnValue(accessToken);
    tokenService.createRefreshToken.mockReturnValue(refreshToken);

    // When
    const result = await handler.execute(command);

    // Then
    expect(otpStore.get).toHaveBeenCalledWith(challengeId);
    expect(otpStore.incrementAttempts).toHaveBeenCalledWith(challengeId);
    expect(configService.getOrThrow).toHaveBeenCalledWith('OTP_SECRET');
    expect(otpGenerator.hashOtp).toHaveBeenCalledWith(
      challengeId,
      code,
      OTP_SECRET,
    );
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { email },
    });
    expect(tokenService.createAccessToken).toHaveBeenCalledWith(userId);
    expect(tokenService.createRefreshToken).toHaveBeenCalledWith(
      userId,
      expect.any(String),
    );
    expect(refreshTokenStorage.insert).toHaveBeenCalledWith(
      userId,
      expect.any(String),
    );

    expect(result).toEqual({
      hasError: false,
      data: {
        accessToken,
        refreshToken,
      },
    });
  });

  it('should throw InvalidOtp error when otpChallenge was not found', async () => {
    // Given
    const challengeId = 'non-existent-id';
    const code = '123456';
    const command = new VerifyOtpCommand(challengeId, code);

    otpStore.get.mockResolvedValue(null);

    // When & Then
    await expect(handler.execute(command)).rejects.toThrow(InvalidOtp);
    expect(otpStore.incrementAttempts).not.toHaveBeenCalled();
    expect(otpGenerator.hashOtp).not.toHaveBeenCalled();
  });

  it('should throw InvalidOtp when otp code hash does not match', async () => {
    // Given
    const challengeId = 'challenge-123';
    const code = 'wrong-code';
    const command = new VerifyOtpCommand(challengeId, code);

    otpStore.get.mockResolvedValue({
      email: 'test@example.com',
      codeHash: 'expected-hash',
      attempts: 1,
      createdAt: Date.now(),
    });
    otpGenerator.hashOtp.mockReturnValue('calculated-different-hash');

    // When & Then
    await expect(handler.execute(command)).rejects.toThrow(InvalidOtp);
    expect(otpStore.incrementAttempts).toHaveBeenCalledWith(challengeId);
    expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    expect(tokenService.createAccessToken).not.toHaveBeenCalled();
  });

  it('should throw TooManyAttempts when attempts number is greater than 5', async () => {
    // Given
    const challengeId = 'challenge-123';
    const code = '123456';
    const command = new VerifyOtpCommand(challengeId, code);
    const codeHash = 'valid-hash';

    otpStore.get.mockResolvedValue({
      email: 'test@example.com',
      codeHash,
      attempts: 6,
      createdAt: Date.now(),
    });
    otpGenerator.hashOtp.mockReturnValue(codeHash);

    // When & Then
    await expect(handler.execute(command)).rejects.toThrow(TooManyAttempts);
    expect(prismaService.user.findUnique).not.toHaveBeenCalled();
  });

  it('should throw UserNotFound when user is not found in database', async () => {
    // Given
    const challengeId = 'challenge-123';
    const code = '123456';
    const command = new VerifyOtpCommand(challengeId, code);
    const codeHash = 'valid-hash';

    otpStore.get.mockResolvedValue({
      email: 'deleted-user@example.com',
      codeHash,
      attempts: 1,
      createdAt: Date.now(),
    });
    otpGenerator.hashOtp.mockReturnValue(codeHash);
    prismaService.user.findUnique.mockResolvedValue(null);

    // When & Then
    await expect(handler.execute(command)).rejects.toThrow(UserNotFound);
    expect(tokenService.createAccessToken).not.toHaveBeenCalled();
    expect(refreshTokenStorage.insert).not.toHaveBeenCalled();
  });
});
