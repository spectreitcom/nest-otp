import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterUserDto } from './dto/register-user.dto';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from './commands/register-user.command';
import { RequestOtpDto } from './dto/request-otp.dto';
import { OtpRequestCommand } from './commands/otp-request.command';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyOtpCommand } from './commands/verify-otp.command';
import {
  InvalidOtp,
  TooManyAttempts,
  UserAlreadyExists,
  UserNotFound,
} from './exceptions';
import { EServiceErrorCode, IServiceResponse } from '@app/shared';

@Controller()
export class AuthServiceController {
  private readonly logger = new Logger(AuthServiceController.name);

  constructor(private readonly commandBus: CommandBus) {}

  @MessagePattern('auth.register')
  async registerUser(@Payload() payload: RegisterUserDto) {
    try {
      return await this.commandBus.execute<
        RegisterUserCommand,
        IServiceResponse<{ id: string }>
      >(new RegisterUserCommand(payload.email));
    } catch (error) {
      if (error instanceof UserAlreadyExists) {
        this.logger.debug(error.message, error.stack);
        return {
          hasError: true,
          code: EServiceErrorCode.CONFLICT,
          errorMessage: 'User already exists',
        } satisfies IServiceResponse;
      } else if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      } else {
        this.logger.error('Non-Error thrown during user registration', error);
      }

      return {
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      } satisfies IServiceResponse;
    }
  }

  @MessagePattern('auth.requestOtp')
  async requestOtp(@Payload() payload: RequestOtpDto) {
    try {
      return await this.commandBus.execute<
        OtpRequestCommand,
        IServiceResponse<{ challengeId: string }>
      >(new OtpRequestCommand(payload.email));
    } catch (error) {
      if (error instanceof UserNotFound) {
        this.logger.debug(error.message, error.stack);
        return {
          hasError: true,
          code: EServiceErrorCode.NOT_FOUND,
          errorMessage: 'User not found',
        } satisfies IServiceResponse;
      } else if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      } else {
        this.logger.error('Non-Error thrown during user registration', error);
      }

      return {
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      } satisfies IServiceResponse;
    }
  }

  @MessagePattern('auth.verifyOtp')
  async verifyOtp(@Payload() payload: VerifyOtpDto) {
    try {
      return await this.commandBus.execute<
        VerifyOtpCommand,
        IServiceResponse<{ accessToken: string; refreshToken: string }>
      >(new VerifyOtpCommand(payload.challengeId, payload.code));
    } catch (error) {
      if (error instanceof InvalidOtp) {
        this.logger.debug(error.message, error.stack);
        return {
          hasError: true,
          code: EServiceErrorCode.BAD_REQUEST,
          errorMessage: error.message,
        } satisfies IServiceResponse;
      } else if (error instanceof TooManyAttempts) {
        this.logger.debug(error.message, error.stack);
        return {
          hasError: true,
          code: EServiceErrorCode.BAD_REQUEST,
          errorMessage: error.message,
        } satisfies IServiceResponse;
      } else if (error instanceof UserNotFound) {
        this.logger.debug(error.message, error.stack);
        return {
          hasError: true,
          code: EServiceErrorCode.NOT_FOUND,
          errorMessage: 'User not found',
        } satisfies IServiceResponse;
      } else if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      } else {
        this.logger.error('Non-Error thrown during user registration', error);
      }

      return {
        hasError: true,
        code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
        errorMessage: 'Internal server error',
      } satisfies IServiceResponse;
    }
  }
}
