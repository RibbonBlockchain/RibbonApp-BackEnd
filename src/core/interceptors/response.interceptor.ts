import { map } from 'rxjs/operators';
import { RESPONSE } from '../responses';
import { Response as IResponse, Request as IRequest } from 'express';
import { Injectable, CallHandler, NestInterceptor, ExecutionContext } from '@nestjs/common';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, nextCallHandler: CallHandler) {
    const skipPaths = ['/'];
    const url = context.switchToHttp().getRequest<IRequest>().url;
    const status = context.switchToHttp().getResponse<IResponse>().statusCode;
    if (skipPaths.includes(url)) return nextCallHandler.handle();

    return nextCallHandler.handle().pipe(
      map((res) => {
        const timestamp = new Date().toISOString();
        const message = res?.message ?? RESPONSE.SUCCESS;
        return { status, message, timestamp, data: res?.data ?? {} };
      }),
    );
  }
}
