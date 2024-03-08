import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ReqUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  let req = context.switchToHttp().getRequest();
  return req.user;
});
