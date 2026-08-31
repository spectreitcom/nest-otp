import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  EServiceErrorCode,
  IServiceErrorResponse,
} from './service-response.interface';

export function errorMapper(response: IServiceErrorResponse) {
  switch (response.code) {
    case EServiceErrorCode.CONFLICT:
      return new ConflictException(response.errorMessage);
    case EServiceErrorCode.INTERNAL_SERVER_ERROR:
      return new InternalServerErrorException(response.errorMessage);
    case EServiceErrorCode.SERVICE_UNAVAILABLE:
      return new ServiceUnavailableException(response.errorMessage);
    case EServiceErrorCode.BAD_REQUEST:
      return new BadRequestException(response.errorMessage);
    case EServiceErrorCode.NOT_FOUND:
      return new NotFoundException(response.errorMessage);
    default: {
      return new InternalServerErrorException('Internal server error');
    }
  }
}
