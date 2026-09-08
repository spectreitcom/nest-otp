import { AuthServiceController } from '../auth-service.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserDto } from '../dto/register-user.dto';
import { RequestOtpDto } from '../dto/request-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { GetMeDto } from '../dto/get-me.dto';
import { RegisterUserCommand } from '../commands/register-user.command';
import { OtpRequestCommand } from '../commands/otp-request.command';
import { VerifyOtpCommand } from '../commands/verify-otp.command';
import { GetMeQuery } from '../queries/get-me.query';
import {
  InvalidOtp,
  TooManyAttempts,
  UserAlreadyExists,
  UserNotFound,
} from '../exceptions';
import { EServiceErrorCode, IServiceResponse } from '@app/shared';
import { randomUUID } from 'node:crypto';

describe('AuthServiceController', () => {
  let controller: AuthServiceController;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };

    controller = new AuthServiceController(
      commandBus as unknown as CommandBus,
      queryBus as unknown as QueryBus,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerUser', () => {
    const payload: RegisterUserDto = {
      email: 'test@example.com',
    };

    it('should dispatch RegisterUserCommand and return successful service response', async () => {
      // Given
      const expectedResponse: IServiceResponse<{ id: string }> = {
        hasError: false,
        data: { id: randomUUID() },
      };
      commandBus.execute.mockResolvedValue(expectedResponse);

      // When
      const result = await controller.registerUser(payload);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        new RegisterUserCommand(payload.email),
      );
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should return CONFLICT error response when UserAlreadyExists exception is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue(
        new UserAlreadyExists('User already exists in db'),
      );

      // When
      const result = await controller.registerUser(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.CONFLICT,
        errorMessage: 'User already exists',
      });
    });

    it('should return INTERNAL_SERVER_ERROR response when generic Error is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue(new Error('Unexpected DB outage'));

      // When
      const result = await controller.registerUser(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      });
    });

    it('should return INTERNAL_SERVER_ERROR response when non-Error object is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue('Unknown error occurred');

      // When
      const result = await controller.registerUser(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      });
    });
  });

  describe('requestOtp', () => {
    const payload: RequestOtpDto = {
      email: 'test@example.com',
    };

    it('should dispatch OtpRequestCommand and return successful response', async () => {
      // Given
      const expectedResponse: IServiceResponse<{ challengeId: string }> = {
        hasError: false,
        data: { challengeId: randomUUID() },
      };
      commandBus.execute.mockResolvedValue(expectedResponse);

      // When
      const result = await controller.requestOtp(payload);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        new OtpRequestCommand(payload.email),
      );
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should return NOT_FOUND error response when UserNotFound exception is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue(new UserNotFound('User not found'));

      // When
      const result = await controller.requestOtp(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.NOT_FOUND,
        errorMessage: 'User not found',
      });
    });

    it('should return INTERNAL_SERVER_ERROR response when generic Error is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue(
        new Error('Redis connection failure'),
      );

      // When
      const result = await controller.requestOtp(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      });
    });

    it('should return INTERNAL_SERVER_ERROR response when non-Error object is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue({ error: 'fatal' });

      // When
      const result = await controller.requestOtp(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      });
    });
  });

  describe('verifyOtp', () => {
    const payload: VerifyOtpDto = {
      challengeId: randomUUID(),
      code: '123456',
    };

    it('should dispatch VerifyOtpCommand and return token pair response', async () => {
      // Given
      const expectedResponse: IServiceResponse<{
        accessToken: string;
        refreshToken: string;
      }> = {
        hasError: false,
        data: {
          accessToken: 'jwt-access-token',
          refreshToken: 'jwt-refresh-token',
        },
      };
      commandBus.execute.mockResolvedValue(expectedResponse);

      // When
      const result = await controller.verifyOtp(payload);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        new VerifyOtpCommand(payload.challengeId, payload.code),
      );
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should return BAD_REQUEST error response when InvalidOtp exception is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue(new InvalidOtp('Invalid OTP code'));

      // When
      const result = await controller.verifyOtp(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.BAD_REQUEST,
        errorMessage: 'Invalid OTP code',
      });
    });

    it('should return BAD_REQUEST error response when TooManyAttempts exception is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue(
        new TooManyAttempts('Too many verification attempts'),
      );

      // When
      const result = await controller.verifyOtp(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.BAD_REQUEST,
        errorMessage: 'Too many verification attempts',
      });
    });

    it('should return NOT_FOUND error response when UserNotFound exception is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue(new UserNotFound('User not found'));

      // When
      const result = await controller.verifyOtp(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.NOT_FOUND,
        errorMessage: 'User not found',
      });
    });

    it('should return INTERNAL_SERVER_ERROR response when generic Error is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue(new Error('JWT signing error'));

      // When
      const result = await controller.verifyOtp(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      });
    });

    it('should return INTERNAL_SERVER_ERROR response when non-Error object is thrown', async () => {
      // Given
      commandBus.execute.mockRejectedValue(null);

      // When
      const result = await controller.verifyOtp(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      });
    });
  });

  describe('getMe', () => {
    const payload: GetMeDto = {
      userId: randomUUID(),
    };

    it('should dispatch GetMeQuery and return user data response', async () => {
      // Given
      const expectedResponse: IServiceResponse<{
        id: string;
        email: string;
      }> = {
        hasError: false,
        data: {
          id: payload.userId,
          email: 'test@example.com',
        },
      };
      queryBus.execute.mockResolvedValue(expectedResponse);

      // When
      const result = await controller.getMe(payload);

      // Then
      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetMeQuery(payload.userId),
      );
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should return NOT_FOUND error response when UserNotFound exception is thrown', async () => {
      // Given
      queryBus.execute.mockRejectedValue(new UserNotFound('User not found'));

      // When
      const result = await controller.getMe(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.NOT_FOUND,
        errorMessage: 'User not found',
      });
    });

    it('should return INTERNAL_SERVER_ERROR response when generic Error is thrown', async () => {
      // Given
      queryBus.execute.mockRejectedValue(new Error('Query execution error'));

      // When
      const result = await controller.getMe(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      });
    });

    it('should return INTERNAL_SERVER_ERROR response when non-Error object is thrown', async () => {
      // Given
      queryBus.execute.mockRejectedValue(undefined);

      // When
      const result = await controller.getMe(payload);

      // Then
      expect(result).toEqual({
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      });
    });
  });
});
