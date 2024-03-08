import { eq } from 'drizzle-orm';
import { go } from '@/core/utils/http';
import { RESPONSE } from '@/core/responses';
import { Request, Response } from 'express';
import { User } from '@/modules/drizzle/schema';
import { TokenService } from '@/core/services/token.service';
import { DATABASE, X_REFRESH_TOKEN } from '@/core/constants';
import { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import { TDbProvider } from '@/modules/drizzle/drizzle.module';
import { Inject, Injectable, HttpStatus, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

const exception = new UnauthorizedException({
  data: {},
  status: HttpStatus.UNAUTHORIZED,
  message: RESPONSE.NOT_LOGGED_IN,
  timestamp: new Date().toISOString(),
});

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    protected readonly token: TokenService,
    @Inject(DATABASE) protected readonly provider: TDbProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { accessToken } = this.extractTokensFromHeader(request);

    if (!accessToken) throw exception;
    const [data, error] = await go<JwtPayload, JsonWebTokenError>(() => this.token.verifyAccessToken(accessToken));

    if (error && error.name !== 'TokenExpiredError') throw exception;
    if (error && error.name === 'TokenExpiredError') return this.handleTokenRefresh(request, response);

    const userId = +data?.sub!;
    const user = await this.provider.db.query.User.findFirst({ where: eq(User.id, userId), with: { auth: true } });
    if (!user || !user.auth || !user.auth.accessToken || user.auth.accessToken !== accessToken) throw exception;

    request['user'] = user;
    return true;
  }

  private extractTokensFromHeader(request: Request): { accessToken?: string; refreshToken?: string } {
    const [type, reqAccesstoken] = request.headers.authorization?.split(' ') ?? [];
    const accessToken = type === 'Bearer' ? reqAccesstoken : undefined;

    return { accessToken, refreshToken: <string>request.headers[X_REFRESH_TOKEN] };
  }

  private async handleTokenRefresh(request: any, response: Response) {
    const { accessToken, refreshToken } = this.extractTokensFromHeader(request);
    if (!refreshToken) throw exception;

    const [data] = await go<JwtPayload, JsonWebTokenError>(() => this.token.verifyRefreshToken(refreshToken));
    if (!data) throw exception;

    const userId = +data?.sub!;
    const user = await this.provider.db.query.User.findFirst({ with: { auth: true }, where: eq(User.id, userId) });

    const validAccessToken = user?.auth?.accessToken === accessToken;
    const validRefreshToken = user?.auth?.refreshToken === refreshToken;
    if (!user || !validAccessToken || !validRefreshToken) throw exception;

    const payload = { sub: userId };
    const [aToken, rToken] = [this.token.generateAccessToken(payload), this.token.generateRefreshToken(payload)];

    request['user'] = user;

    // TODO: update refresh token logic
    response.setHeader(X_REFRESH_TOKEN, aToken);
    response.setHeader(X_REFRESH_TOKEN, rToken);

    return true;
  }
}
