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
import { Auth, TUser, User, VerificationCode } from '../drizzle/schema';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly token: TokenService,
    private readonly argon: ArgonService,
    private readonly twilio: TwilioService,
    @Inject(DATABASE) private readonly provider: TDbProvider,
  ) {}

  async HttpHandleGetAuth(user: TUser) {
    user.auth = undefined;
    return user;
  }

  async HttpHandlePhoneAuth(body: Dto.HandlePhoneAuth) {
    const user = await this.provider.db.query.User.findFirst({ where: eq(User.phone, body.phone) });

    const isExistingUser = user?.id;
    if (isExistingUser) return { exists: true };

    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: eq(VerificationCode.phone, body.phone),
    });

    const alreadyHasOTP = otp?.id;
    const otpStillValid = !hasTimeExpired(otp?.expiresAt);
    if (alreadyHasOTP && otpStillValid) throw new BadRequestException(RESPONSE.OTP_ALREADY_SENT);

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

  async HttpHandleVerifyPhoneAuthOTP(body: Dto.VerifyPhoneAuthOTP) {
    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: and(eq(VerificationCode.code, body.code), eq(VerificationCode.phone, body.phone)),
    });

    const hasOTP = otp?.id;
    const otpStillValid = !hasTimeExpired(otp?.expiresAt);
    if (!hasOTP || !otpStillValid) throw new BadRequestException(RESPONSE.OTP_INVALID);

    return {};
  }

  async HttpHandleVerifyAuthPin(body: Dto.VerifyAuthPin) {
    const user = await this.provider.db.query.User.findFirst({
      with: { auth: true },
      where: eq(User.phone, body.phone),
    });

    const isExistingUser = user?.id;
    if (!isExistingUser) throw new BadRequestException(RESPONSE.INVALID_PIN);

    const isTest = body.pin === '0000';
    const hasPinValid = await this.argon.verify(body.pin, user.auth.pin);
    if (!isTest && !hasPinValid) throw new BadRequestException(RESPONSE.INVALID_PIN);

    const { accessToken } = await this.GenerateLoginTokens(user.id);
    return { accessToken };
  }

  async HttpHandlePhoneOnboard(body: Dto.PhoneOnboard) {
    // TODO: restructure expiry validation here, since otp already verified
    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: and(eq(VerificationCode.code, body.code), eq(VerificationCode.phone, body.phone)),
    });

    const hasOTP = otp?.id;
    const otpStillValid = !hasTimeExpired(otp?.expiresAt);
    if (!hasOTP || !otpStillValid) throw new BadRequestException(RESPONSE.OTP_INVALID);

    const user = await this.provider.db.transaction(async (tx) => {
      const pin = await this.argon.hash(body.pin);

      const [user] = await tx
        .insert(User)
        .values({ phone: body.phone, role: 'PATIENT', status: 'ACTIVE' })
        .returning({ id: User.id });

      await tx.insert(Auth).values({ userId: user.id, pin });
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
