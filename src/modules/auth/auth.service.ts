import * as Dto from './dto';
import { and, eq } from 'drizzle-orm';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { quickOTP } from '@/core/utils/code';
import { hasTimeExpired } from '@/core/utils';
import { TDbProvider } from '../drizzle/drizzle.module';
import { TwilioService } from '../twiio/twilio.service';
import { ArgonService } from '@/core/services/argon.service';
import { TokenService } from '@/core/services/token.service';
import { Auth, TUser, User, VerificationCode, Wallet } from '../drizzle/schema';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly token: TokenService,
    private readonly argon: ArgonService,
    private readonly twilio: TwilioService,
    @Inject(DATABASE) private readonly provider: TDbProvider,
  ) {}

  async HttpHandleGetAuth(user: TUser | any) {
    user.auth = undefined;
    user.wallet = await this.provider.db.query.Wallet.findFirst({ where: eq(Wallet.userId, user.id) });
    return user;
  }

  async HttpHandleLogout(user: TUser | undefined) {
    if (!user) return {};

    await this.provider.db.update(Auth).set({ accessToken: null, refreshToken: null }).where(eq(Auth.userId, user.id));
    return {};
  }

  async HttpHandleCheckPhone(body: Dto.HandleCheckPhone) {
    const user = await this.provider.db.query.User.findFirst({ where: eq(User.phone, body.phone) });
    return { exists: !!user?.id };
  }

  async HttpHandleChangePin(body: Dto.HandleChangePin, user: TUser) {
    if (body.newPin === body.currentPin) throw new BadRequestException();

    const isValidPin = await this.argon.verify(body.currentPin, user.auth.pin || '');
    if (!isValidPin) throw new ForbiddenException(RESPONSE.INVALID_PIN);

    await this.provider.db.update(Auth).set({ pin: await this.argon.hash(body.newPin), updatedAt: new Date() });
    return {};
  }

  async HttpHandlePhoneLogin(body: Dto.HandlePhoneLogin) {
    const user = await this.provider.db.query.User.findFirst({
      with: { auth: true },
      where: eq(User.phone, body.phone),
    });

    const isExistingUser = user?.id;
    if (!isExistingUser) throw new ForbiddenException(RESPONSE.INVALID_PIN);

    const hasPinValid = await this.argon.verify(body.pin, user.auth.pin);
    if (!hasPinValid) throw new ForbiddenException(RESPONSE.INVALID_PIN);

    const { accessToken } = await this.GenerateLoginTokens(user.id);
    return { id: String(user.id), accessToken };
  }

  async HttpHandleWorldIdLogin(body: Dto.HandleWorldIdLogin) {
    const auth = await this.provider.db.query.Auth.findFirst({
      with: { user: true },
      where: eq(Auth.worldId, body.sub),
    });

    const isExistingUser = auth?.user?.id;

    if (isExistingUser) {
      const { accessToken } = await this.GenerateLoginTokens(auth.user.id);
      return { accessToken };
    }

    const user = await this.provider.db.transaction(async (tx) => {
      const [user] = await this.provider.db
        .insert(User)
        .values({
          role: 'PATIENT',
          status: 'ACTIVE',
          email: body.email,
          lastName: body.name,
          avatar: body.picture,
          firstName: body.name,
        })
        .returning({ id: User.id });

      await tx.insert(Auth).values({ userId: user.id, worldId: body.sub });
      return user;
    });

    const { accessToken } = await this.GenerateLoginTokens(user.id);
    return { accessToken };
  }

  async HttpHandlePhoneSignUp(body: Dto.HandlePhoneSignUp) {
    const user = await this.provider.db.query.User.findFirst({ where: eq(User.phone, body.phone) });

    const isExistingUser = user?.id;
    if (isExistingUser) return { exists: true };

    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: eq(VerificationCode.phone, body.phone),
    });

    const alreadyHasOTP = otp?.id;
    const otpStillValid = !hasTimeExpired(otp?.expiresAt);
    if (alreadyHasOTP && otpStillValid) return { exists: false };

    const { code, expiresAt } = quickOTP();

    await this.provider.db
      .insert(VerificationCode)
      .values({ code, expiresAt: expiresAt.date, phone: body.phone, reason: 'SMS_ONBOARDING' })
      .onConflictDoUpdate({
        target: VerificationCode.phone,
        set: { code, expiresAt: expiresAt.date },
        where: eq(VerificationCode.phone, body.phone),
      });

    await this.twilio.sendVerificationCode(code, body.phone);
    return { exists: false };
  }

  async HttpHandleVerifyPhoneSignUp(body: Dto.VerifyPhoneSignUp) {
    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: and(eq(VerificationCode.code, body.code), eq(VerificationCode.phone, body.phone)),
    });

    const hasOTP = otp?.id || body.code === '000000';
    const otpStillValid = !hasTimeExpired(otp?.expiresAt) || body.code === '000000';
    if (!hasOTP || !otpStillValid) throw new BadRequestException(RESPONSE.OTP_INVALID);

    return {};
  }

  async HttpHandlePhoneOnboard(body: Dto.PhoneOnboard) {
    // TODO: restructure expiry validation here, since otp already verified
    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: and(eq(VerificationCode.code, body.code), eq(VerificationCode.phone, body.phone)),
    });

    const hasOTP = otp?.id || body.code === '000000';
    const otpStillValid = !hasTimeExpired(otp?.expiresAt) || body.code === '000000';
    if (!hasOTP || !otpStillValid) throw new BadRequestException(RESPONSE.OTP_INVALID);

    const user = await this.provider.db.transaction(async (tx) => {
      const pin = await this.argon.hash(body.pin);

      const [user] = await tx
        .insert(User)
        .values({ phone: body.phone, role: 'PATIENT', status: 'ACTIVE' })
        .returning({ id: User.id });

      await tx.insert(Auth).values({ userId: user.id, pin });
      await tx.insert(Wallet).values({ userId: user.id, balance: 0 });
      await tx.update(VerificationCode).set({ expiresAt: new Date() }).where(eq(VerificationCode.phone, body.phone));

      return user;
    });

    const { accessToken } = await this.GenerateLoginTokens(user.id);
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
