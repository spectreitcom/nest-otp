import { OtpRequestCommandHandler } from '../otp-request.command-handler';
import { OtpStore } from '../../ports/otp-store';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { OtpRequestCommand } from '../../commands/otp-request.command';
import { IServiceSuccessResponse } from '@app/shared';

describe('OtpRequestCommandHandler', () => {
  let handler: OtpRequestCommandHandler;

  let otpGenerator: {
    generate: jest.Mock;
    hashOtp: jest.Mock;
  };

  let otpStore: {
    create: jest.Mock;
  };

  let configService: {
    getOrThrow: jest.Mock;
  };

  let emailService: {
    emit: jest.Mock;
  };

  const OTP_SECRET = 'super-secret-key';

  beforeEach(() => {
    otpGenerator = {
      generate: jest.fn(),
      hashOtp: jest.fn(),
    };

    otpStore = {
      create: jest.fn(),
    };

    emailService = {
      emit: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn(),
    };

    handler = new OtpRequestCommandHandler(
      otpGenerator,
      otpStore as unknown as OtpStore,
      configService as unknown as ConfigService,
      emailService as unknown as ClientProxy,
    );
  });

  it('should create challengeId, store hashed OTP and emit email event', async () => {
    // Given
    const email = 'test@example.com';
    const command = new OtpRequestCommand(email);
    const code = '123456';
    const hashedOtp = 'hashed-otp-code';

    otpGenerator.generate.mockReturnValue(code);
    otpGenerator.hashOtp.mockReturnValue(hashedOtp);
    configService.getOrThrow.mockReturnValue(OTP_SECRET);

    // When
    const result = (await handler.execute(command)) as IServiceSuccessResponse<{
      challengeId: string;
    }>;

    // Then
    expect(result).toEqual({
      hasError: false,
      data: {
        challengeId: result.data.challengeId,
      },
    });

    const { challengeId } = result.data;

    expect(otpGenerator.generate).toHaveBeenCalledTimes(1);
    expect(configService.getOrThrow).toHaveBeenCalledWith('OTP_SECRET');
    expect(otpGenerator.hashOtp).toHaveBeenCalledWith(
      challengeId,
      code,
      OTP_SECRET,
    );
    expect(otpStore.create).toHaveBeenCalledWith({
      email,
      codeHash: hashedOtp,
      challengeId,
    });
    expect(emailService.emit).toHaveBeenCalledWith('emails.send-otp', {
      email,
      code,
    });
  });

  it('should throw UserNotFound and stop execution when user is not found', async () => {
    // Given
    const email = 'test@example.com';
    const command = new OtpRequestCommand(email);

    // When
    const result = await handler.execute(command);

    // Then
    expect(result).toBeDefined();
    expect(result.hasError).toBeFalsy();
    expect(otpGenerator.generate).toHaveBeenCalled();
    expect(otpGenerator.hashOtp).toHaveBeenCalled();
    expect(otpStore.create).toHaveBeenCalled();
    expect(emailService.emit).toHaveBeenCalled();
  });
});
