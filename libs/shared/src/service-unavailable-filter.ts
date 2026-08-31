import { catchError, pipe, throwError, timeout } from 'rxjs';
import { IServiceResponse } from './service-response.interface';
import { ServiceUnavailableException } from '@nestjs/common';

export function handleServiceUnavailable<
  TData extends Record<PropertyKey, unknown>,
>(ms = 5000) {
  return pipe(
    timeout<IServiceResponse<TData>>(ms),
    catchError(() => throwError(() => new ServiceUnavailableException())),
  );
}
