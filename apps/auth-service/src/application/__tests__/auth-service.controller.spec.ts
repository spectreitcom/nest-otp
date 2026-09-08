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
import { IServiceResponse } from '@app/shared';
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

    it('should rethrow error when commandBus.execute fails', async () => {
      // Given
      const error = new Error('Unexpected error');
      commandBus.execute.mockRejectedValue(error);

      // When & Then
      await expect(controller.registerUser(payload)).rejects.toThrow(error);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new RegisterUserCommand(payload.email),
      );
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

    it('should rethrow error when commandBus.execute fails', async () => {
      // Given
      const error = new Error('Service failure');
      commandBus.execute.mockRejectedValue(error);

      // When & Then
      await expect(controller.requestOtp(payload)).rejects.toThrow(error);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new OtpRequestCommand(payload.email),
      );
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

    it('should rethrow error when commandBus.execute fails', async () => {
      // Given
      const error = new Error('Service failure');
      commandBus.execute.mockRejectedValue(error);

      // When & Then
      await expect(controller.verifyOtp(payload)).rejects.toThrow(error);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new VerifyOtpCommand(payload.challengeId, payload.code),
      );
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

    it('should rethrow error when queryBus.execute fails', async () => {
      // Given
      const error = new Error('Query failure');
      queryBus.execute.mockRejectedValue(error);

      // When & Then
      await expect(controller.getMe(payload)).rejects.toThrow(error);
      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetMeQuery(payload.userId),
      );
    });
  });
});
