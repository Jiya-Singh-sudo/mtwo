// src/common/decorators/request-context.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getRequestContext } from '../utlis/request-context.util';

export const RequestContextDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return getRequestContext(req);
  },
);
