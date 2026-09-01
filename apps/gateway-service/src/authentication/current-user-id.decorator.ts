import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppRequest } from '../request';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AppRequest>();
    if (request['user']) return request['user'];
    return null;
  },
);
