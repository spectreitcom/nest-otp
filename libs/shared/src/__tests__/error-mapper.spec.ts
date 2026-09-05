import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { errorMapper } from '../error-mapper';
import {
  EServiceErrorCode,
  IServiceErrorResponse,
} from '../service-response.interface';

describe('errorMapper', () => {
  it('should map CONFLICT to ConflictException with correct message', () => {
    const errorResponse: IServiceErrorResponse = {
      hasError: true,
      code: EServiceErrorCode.CONFLICT,
      errorMessage: 'User with given email already exists',
    };

    const result = errorMapper(errorResponse);

    expect(result).toBeInstanceOf(ConflictException);
    expect(result.message).toBe('User with given email already exists');
    expect(result.getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('should map INTERNAL_SERVER_ERROR to InternalServerErrorException with correct message', () => {
    const errorResponse: IServiceErrorResponse = {
      hasError: true,
      code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
      errorMessage: 'Database connection failed',
    };

    const result = errorMapper(errorResponse);

    expect(result).toBeInstanceOf(InternalServerErrorException);
    expect(result.message).toBe('Database connection failed');
    expect(result.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('should map SERVICE_UNAVAILABLE to ServiceUnavailableException with correct message', () => {
    const errorResponse: IServiceErrorResponse = {
      hasError: true,
      code: EServiceErrorCode.SERVICE_UNAVAILABLE,
      errorMessage: 'Auth service is unavailable',
    };

    const result = errorMapper(errorResponse);

    expect(result).toBeInstanceOf(ServiceUnavailableException);
    expect(result.message).toBe('Auth service is unavailable');
    expect(result.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('should map BAD_REQUEST to BadRequestException with correct message', () => {
    const errorResponse: IServiceErrorResponse = {
      hasError: true,
      code: EServiceErrorCode.BAD_REQUEST,
      errorMessage: 'Invalid payload provided',
    };

    const result = errorMapper(errorResponse);

    expect(result).toBeInstanceOf(BadRequestException);
    expect(result.message).toBe('Invalid payload provided');
    expect(result.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should map NOT_FOUND to NotFoundException with correct message', () => {
    const errorResponse: IServiceErrorResponse = {
      hasError: true,
      code: EServiceErrorCode.NOT_FOUND,
      errorMessage: 'Resource not found',
    };

    const result = errorMapper(errorResponse);

    expect(result).toBeInstanceOf(NotFoundException);
    expect(result.message).toBe('Resource not found');
    expect(result.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('should return default InternalServerErrorException when code is unhandled or invalid', () => {
    const errorResponse = {
      hasError: true as const,
      code: 'UNKNOWN_CODE' as unknown as EServiceErrorCode,
      errorMessage: 'Some unexpected error message',
    };

    const result = errorMapper(errorResponse);

    expect(result).toBeInstanceOf(InternalServerErrorException);
    expect(result.message).toBe('Internal server error');
    expect(result.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
