import { Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { EServiceErrorCode, IServiceResponse } from '@app/shared';
import {
  InvalidOtp,
  TooManyAttempts,
  UserAlreadyExists,
  UserNotFound,
} from '../application/exceptions';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorFilter.name);

  catch(exception: unknown) {
    if (exception instanceof UserAlreadyExists) {
      this.logger.debug(exception.message, exception.stack);
      return {
        hasError: true,
        code: EServiceErrorCode.CONFLICT,
        errorMessage: 'User already exists',
      } satisfies IServiceResponse;
    } else if (exception instanceof UserNotFound) {
      this.logger.debug(exception.message, exception.stack);
      return {
        hasError: true,
        code: EServiceErrorCode.NOT_FOUND,
        errorMessage: 'User not found',
      } satisfies IServiceResponse;
    } else if (exception instanceof InvalidOtp) {
      this.logger.debug(exception.message, exception.stack);
      return {
        hasError: true,
        code: EServiceErrorCode.BAD_REQUEST,
        errorMessage: exception.message,
      } satisfies IServiceResponse;
    } else if (exception instanceof TooManyAttempts) {
      this.logger.debug(exception.message, exception.stack);
      return {
        hasError: true,
        code: EServiceErrorCode.BAD_REQUEST,
        errorMessage: exception.message,
      } satisfies IServiceResponse;
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error('Non-Error thrown', exception);
    }

    return {
      hasError: true,
      code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
      errorMessage: 'Internal server error',
    } satisfies IServiceResponse;
  }
}
