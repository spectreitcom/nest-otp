import { z } from 'zod';

export enum EServiceErrorCode {
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
}

export const serviceResponseSchema = <TData>(data: z.ZodSchema<TData>) =>
  z.discriminatedUnion('hasError', [
    z.object({
      hasError: z.literal(false),
      data,
    }),
    z.object({
      hasError: z.literal(true),
      code: z.enum(EServiceErrorCode),
      errorMessage: z.string(),
    }),
  ]);

export interface IServiceSuccessResponse<
  TData extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>,
> {
  hasError: false;
  data: TData;
}

export interface IServiceErrorResponse {
  hasError: true;
  code: EServiceErrorCode;
  errorMessage: string;
}

export type IServiceResponse<
  TData extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>,
> = IServiceSuccessResponse<TData> | IServiceErrorResponse;
