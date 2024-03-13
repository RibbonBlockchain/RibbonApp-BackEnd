import * as Dto from './dto';
import { RESPONSE } from '@/core/responses';
import { DATABASE } from '@/core/constants';
import { and, eq, inArray } from 'drizzle-orm';
import { Auth, TUser, User } from '../drizzle/schema';
import { TDbProvider } from '../drizzle/drizzle.module';
import { ArgonService } from '@/core/services/argon.service';
import { TokenService } from '@/core/services/token.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  constructor(
    private readonly token: TokenService,
    private readonly argon: ArgonService,
    @Inject(DATABASE) private readonly provider: TDbProvider,
  ) {}

  async HttpHandleLogout(user: TUser | undefined) {
    if (!user) return {};

    await this.provider.db.update(Auth).set({ accessToken: null, refreshToken: null }).where(eq(Auth.userId, user.id));
    return {};
  }

  async HttpHandleChangePassword(body: Dto.AdminChangePasswordBody, reqUser: TUser) {
    const hasValidPassword = await this.argon.verify(body.oldPassword, reqUser.auth.password);
    if (!hasValidPassword) throw new BadRequestException(RESPONSE.INVALID_CREDENTIALS);

    await this.provider.db
      .update(Auth)
      .set({ password: await this.argon.hash(body.newPassword) })
      .where(eq(Auth.userId, reqUser.id));

    return {};
  }

  async HttpHandleLogin(body: Dto.AdminLoginBody) {
    const admin = await this.provider.db.query.User.findFirst({
      with: { auth: true },
      where: and(eq(User.email, body.email), inArray(User.role, ['ADMIN', 'SUPER_ADMIN'])),
    });

    const isEmailValid = !!admin?.id;
    if (!isEmailValid) throw new BadRequestException(RESPONSE.INVALID_CREDENTIALS);

    const hasValidPassword = await this.argon.verify(body.password, admin.auth.password);
    if (!hasValidPassword) throw new BadRequestException(RESPONSE.INVALID_CREDENTIALS);

    const { accessToken } = await this.GenerateLoginTokens(admin.id);
    return { accessToken };
  }

  private async GenerateLoginTokens(userId: number) {
    const payload = { sub: userId };
    const [accessToken, refreshToken] = [
      this.token.generateAccessToken(payload),
      this.token.generateRefreshToken(payload),
    ];

    await this.provider.db.update(Auth).set({ accessToken, refreshToken }).where(eq(Auth.userId, userId));
    return { accessToken, refreshToken };
  }
}
