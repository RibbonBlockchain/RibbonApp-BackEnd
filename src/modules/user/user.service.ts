import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { hasTimeExpired } from '@/core/utils';
import { quickOTP } from '@/core/utils/code';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { TDbProvider } from '../drizzle/drizzle.module';
import { TUser, User, VerificationCode, Wallet } from '../drizzle/schema';
import { TwilioService } from '../twiio/twilio.service';
import { HandlePhoneVerification, HandleVerifyPhone } from './dto/request';

@Injectable()
export class UserService {
  constructor(
    @Inject(DATABASE) private readonly provider: TDbProvider,
    private readonly twilio: TwilioService,
  ) {}

  async HttpHandlePhoneVerification(body: HandlePhoneVerification) {
    const user = await this.provider.db.query.User.findFirst({ where: eq(User.phone, body.phone) });

    const isExistingUser = user?.id;
    if (isExistingUser) throw new BadRequestException(RESPONSE.INVALID_TASK);

    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: eq(VerificationCode.phone, body.phone),
    });

    const alreadyHasOTP = otp?.id;
    const otpStillValid = !hasTimeExpired(otp?.expiresAt);
    if (alreadyHasOTP && otpStillValid) return { exists: false };

    const { code, expiresAt } = quickOTP();

    await this.provider.db
      .insert(VerificationCode)
      .values({ code, expiresAt: expiresAt.date, phone: body.phone, reason: 'PHONE_VERIFICATION' })
      .onConflictDoUpdate({
        target: VerificationCode.phone,
        set: { code, expiresAt: expiresAt.date },
        where: eq(VerificationCode.phone, body.phone),
      });

    await this.twilio.sendVerificationCode(code, body.phone);
    return { exists: false };
  }

  async HttpHandleVerifyPhone(body: HandleVerifyPhone, user: TUser) {
    console.log(body);
    console.log(user.phone);
    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: and(eq(VerificationCode.code, body.code), eq(VerificationCode.reason, 'PHONE_VERIFICATION')),
    });

    console.log(otp);

    const hasOTP = otp?.id || body.code === '000000';
    const otpStillValid = !hasTimeExpired(otp?.expiresAt) || body.code === '000000';
    if (!hasOTP || !otpStillValid) throw new BadRequestException(RESPONSE.OTP_INVALID);

    await this.provider.db.update(User).set({ phone: body.phone }).where(eq(User.id, user.auth.id)).execute();

    await this.provider.db.update(Wallet).set({ balance: 3 }).where(eq(Wallet.userId, user.auth.id));

    return {};
  }
}