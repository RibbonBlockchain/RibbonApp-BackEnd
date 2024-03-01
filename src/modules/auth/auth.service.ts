import * as Dto from './dto';
import { eq } from 'drizzle-orm';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { quickOTP } from '@/core/utils/code';
import { hasTimeExpired } from '@/core/utils';
import { TDbProvider } from '../drizzle/drizzle.module';
import { TwilioService } from '../twiio/twilio.service';
import { User, VerificationCode } from '../drizzle/schema';
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
    const otpStillValid = hasTimeExpired(otp.expiresAt);
    if (alreadyHasOTP && otpStillValid) throw new BadRequestException(RESPONSE.OTP_ALREADY_SENT);

    const { code, expiresAt } = quickOTP();

    await this.provider.db
      .insert(VerificationCode)
      .values({ code, expiresAt: expiresAt.date, phone: user.phone, reason: 'SMS_ONBOARDING' });

    // TODO: use queues for sending SMS
    // TODO: update twilio to an SMS service
    await this.twilio.sendVerificationCode(code, user.phone);
    return {};
  }
}
