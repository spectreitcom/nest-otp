import { ErrorFilter } from '../error.filter';
import {
  InvalidOtp,
  TooManyAttempts,
  UserAlreadyExists,
  UserNotFound,
} from '../../application/exceptions';
import { EServiceErrorCode } from '@app/shared';

describe('ErrorFilter', () => {
  let filter: ErrorFilter;

  beforeEach(() => {
    filter = new ErrorFilter();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should map UserAlreadyExists to CONFLICT response', () => {
    const error = new UserAlreadyExists('User already exists in db');
    const result = filter.catch(error);
    expect(result).toEqual({
      hasError: true,
      code: EServiceErrorCode.CONFLICT,
      errorMessage: 'User already exists',
    });
  });

  it('should map UserNotFound to NOT_FOUND response', () => {
    const error = new UserNotFound('User not found');
    const result = filter.catch(error);
    expect(result).toEqual({
      hasError: true,
      code: EServiceErrorCode.NOT_FOUND,
      errorMessage: 'User not found',
    });
  });

  it('should map InvalidOtp to BAD_REQUEST response with message', () => {
    const error = new InvalidOtp('Invalid OTP code');
    const result = filter.catch(error);
    expect(result).toEqual({
      hasError: true,
      code: EServiceErrorCode.BAD_REQUEST,
      errorMessage: 'Invalid OTP code',
    });
  });

  it('should map TooManyAttempts to BAD_REQUEST response with message', () => {
    const error = new TooManyAttempts('Too many verification attempts');
    const result = filter.catch(error);
    expect(result).toEqual({
      hasError: true,
      code: EServiceErrorCode.BAD_REQUEST,
      errorMessage: 'Too many verification attempts',
    });
  });

  it('should map generic Error to INTERNAL_SERVER_ERROR response', () => {
    const error = new Error('Unexpected DB outage');
    const result = filter.catch(error);
    expect(result).toEqual({
      hasError: true,
      code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
      errorMessage: 'Internal server error',
    });
  });

  it('should map non-Error exception to INTERNAL_SERVER_ERROR response', () => {
    const result = filter.catch('Unknown error string');
    expect(result).toEqual({
      hasError: true,
      code: EServiceErrorCode.INTERNAL_SERVER_ERROR,
      errorMessage: 'Internal server error',
    });
  });
});
