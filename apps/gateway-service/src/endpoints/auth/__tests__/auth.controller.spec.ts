import { randomUUID } from 'node:crypto';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { RequestOtpDto } from '../dto/request-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

describe('AuthController', () => {
  let controller: AuthController;

  let authService: {
    registerUser: jest.Mock;
    requestOtp: jest.Mock;
    verifyOtp: jest.Mock;
    getMe: jest.Mock;
  };

  beforeEach(() => {
    authService = {
      registerUser: jest.fn(),
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
      getMe: jest.fn(),
    };

    controller = new AuthController(authService as unknown as AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerUser', () => {
    it('should call authService.registerUser with dto and return object with id', async () => {
      // Given
      const dto: RegisterUserDto = {
        email: 'test@example.com',
      };
      const userId = randomUUID();
      authService.registerUser.mockResolvedValue(userId);

      // When
      const result = await controller.registerUser(dto);

      // Then
      expect(result).toEqual({ id: userId });
      expect(authService.registerUser).toHaveBeenCalledWith(dto);
      expect(authService.registerUser).toHaveBeenCalledTimes(1);
    });

    it('should rethrow error when authService.registerUser fails', async () => {
      // Given
      const dto: RegisterUserDto = {
        email: 'test@example.com',
      };
      const error = new Error('Service failure');
      authService.registerUser.mockRejectedValue(error);

      // When & Then
      await expect(controller.registerUser(dto)).rejects.toThrow(error);
      expect(authService.registerUser).toHaveBeenCalledWith(dto);
    });
  });

  describe('requestOtp', () => {
    it('should call authService.requestOtp with dto and return object with challengeId', async () => {
      // Given
      const dto: RequestOtpDto = {
        email: 'test@example.com',
      };
      const challengeId = randomUUID();
      authService.requestOtp.mockResolvedValue(challengeId);

      // When
      const result = await controller.requestOtp(dto);

      // Then
      expect(result).toEqual({ challengeId });
      expect(authService.requestOtp).toHaveBeenCalledWith(dto);
      expect(authService.requestOtp).toHaveBeenCalledTimes(1);
    });

    it('should rethrow error when authService.requestOtp fails', async () => {
      // Given
      const dto: RequestOtpDto = {
        email: 'test@example.com',
      };
      const error = new Error('Service failure');
      authService.requestOtp.mockRejectedValue(error);

      // When & Then
      await expect(controller.requestOtp(dto)).rejects.toThrow(error);
      expect(authService.requestOtp).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyOtp', () => {
    it('should call authService.verifyOtp with dto and return tokens', async () => {
      // Given
      const dto: VerifyOtpDto = {
        challengeId: randomUUID(),
        code: '123456',
      };
      const tokens = {
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-xyz',
      };
      authService.verifyOtp.mockResolvedValue(tokens);

      // When
      const result = await controller.verifyOtp(dto);

      // Then
      expect(result).toEqual(tokens);
      expect(authService.verifyOtp).toHaveBeenCalledWith(dto);
      expect(authService.verifyOtp).toHaveBeenCalledTimes(1);
    });

    it('should rethrow error when authService.verifyOtp fails', async () => {
      // Given
      const dto: VerifyOtpDto = {
        challengeId: randomUUID(),
        code: '123456',
      };
      const error = new Error('Invalid OTP');
      authService.verifyOtp.mockRejectedValue(error);

      // When & Then
      await expect(controller.verifyOtp(dto)).rejects.toThrow(error);
      expect(authService.verifyOtp).toHaveBeenCalledWith(dto);
    });
  });

  describe('getMe', () => {
    it('should call authService.getMe with userId and return user profile', async () => {
      // Given
      const userId = randomUUID();
      const userProfile = {
        id: userId,
        email: 'test@example.com',
      };
      authService.getMe.mockResolvedValue(userProfile);

      // When
      const result = await controller.getMe(userId);

      // Then
      expect(result).toEqual(userProfile);
      expect(authService.getMe).toHaveBeenCalledWith(userId);
      expect(authService.getMe).toHaveBeenCalledTimes(1);
    });

    it('should rethrow error when authService.getMe fails', async () => {
      // Given
      const userId = randomUUID();
      const error = new Error('User not found');
      authService.getMe.mockRejectedValue(error);

      // When & Then
      await expect(controller.getMe(userId)).rejects.toThrow(error);
      expect(authService.getMe).toHaveBeenCalledWith(userId);
    });
  });
});
