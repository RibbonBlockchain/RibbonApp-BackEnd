import * as Dto from './dto';
import { and, eq } from 'drizzle-orm';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { quickOTP } from '@/core/utils/code';
import { hasTimeExpired } from '@/core/utils';
import { TDbProvider } from '../drizzle/drizzle.module';
import { TwilioService } from '../twiio/twilio.service';
import { Auth, User, VerificationCode } from '../drizzle/schema';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly provider: TDbProvider,
    private readonly twilio: TwilioService,
  ) {}

  async HttpHandleRequestOnboardingOTP(body: Dto.RequestOnboardingOTP) {
    const user = await this.provider.db.query.User.findFirst({ where: eq(User.phone, body.phone) });

    const isExistingUser = user?.id;
    if (isExistingUser) return {};

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

    // TODO: use queues for sending SMS
    // TODO: update twilio to an SMS service
    await this.twilio.sendVerificationCode(code, body.phone);
    return {};
  }

  async HttpHandleVerifyOnboardingOTP(body: Dto.VerifyOnboardingOTP) {
    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: and(eq(VerificationCode.code, body.code), eq(VerificationCode.phone, body.phone)),
    });

    const hasOTP = otp?.id;
    const otpStillValid = !hasTimeExpired(otp?.expiresAt);
    if (!hasOTP || !otpStillValid) throw new BadRequestException(RESPONSE.OTP_INVALID);

    await this.provider.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(User)
        .values({ phone: body.phone, role: 'PATIENT', status: 'ACTIVE' })
        .returning({ id: User.id });

      await tx.insert(Auth).values({ userId: user.id });
      await tx.update(VerificationCode).set({ expiresAt: new Date() }).where(eq(VerificationCode.phone, body.phone));
    });

    return {};
  }
}
