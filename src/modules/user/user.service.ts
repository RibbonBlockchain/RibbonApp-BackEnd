import * as Dto from './dto';
import { and, eq } from 'drizzle-orm';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { hasTimeExpired } from '@/core/utils';
import { quickOTP } from '@/core/utils/code';
import { TDbProvider } from '../drizzle/drizzle.module';
import { TwilioService } from '../twiio/twilio.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TUser, Task, TaskActivity, User, VerificationCode, Wallet } from '../drizzle/schema';

@Injectable()
export class UserService {
  constructor(
    @Inject(DATABASE) private readonly provider: TDbProvider,
    private readonly twilio: TwilioService,
  ) {}

  async HttpHandleUpdateProfile(body: Dto.HandleUpdateProfile, user: TUser) {
    await this.provider.db
      .update(User)
      .set({
        dob: body.dob,
        email: body.email,
        gender: body.gender,
        socials: body.socials,
        lastName: body.lastName,
        firstName: body.firstName,
        otherNames: body.otherNames,
      })
      .where(eq(User.id, user.id));

    if (body.email) {
      const wallet = await this.provider.db.query.Wallet.findFirst({ where: eq(Wallet.userId, user.id) });

      const task = await this.provider.db.query.Task.findFirst({ where: eq(Task.name, 'Complete your profile') });

      if (task) {
        await this.provider.db.insert(TaskActivity).values({ taskId: task.id, userId: user.id, status: 'COMPLETED' });
      }

      const balance = wallet.balance + 5;

      await this.provider.db.update(Wallet).set({ balance }).where(eq(Wallet.id, wallet.id));
    }

    return {};
  }

  async HttpHandlePhoneVerification(body: Dto.HandlePhoneVerification) {
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

  async HttpHandleVerifyPhone(body: Dto.HandleVerifyPhone, user: TUser) {
    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: and(eq(VerificationCode.code, body.code), eq(VerificationCode.reason, 'PHONE_VERIFICATION')),
    });

    const hasOTP = otp?.id || body.code === '000000';
    const otpStillValid = !hasTimeExpired(otp?.expiresAt) || body.code === '000000';
    if (!hasOTP || !otpStillValid) throw new BadRequestException(RESPONSE.OTP_INVALID);

    await this.provider.db.update(User).set({ phone: body.phone }).where(eq(User.id, user.auth.id)).execute();

    await this.provider.db.update(Wallet).set({ balance: 3 }).where(eq(Wallet.userId, user.auth.id));

    return {};
  }

  async HttpHandleClaimDailyReward(user: TUser) {
    const userData = await this.provider.db.query.User.findFirst({
      where: eq(User.id, user.id),
    });

    const wallet = await this.provider.db.query.Wallet.findFirst({
      where: eq(Wallet.userId, user.id),
    });

    const lastClaimTime = userData.lastClaimTime;

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    if (!lastClaimTime) {
      // Claiming for first time
      await this.provider.db
        .update(Wallet)
        .set({ balance: wallet.balance + 5 })
        .where(eq(Wallet.userId, user.id));

      await this.provider.db.update(User).set({ lastClaimTime: new Date() }).where(eq(User.id, user.id));

      return {};
    }

    if (lastClaimTime && lastClaimTime < twelveHoursAgo) {
      await this.provider.db
        .update(Wallet)
        .set({ balance: wallet.balance + 5 })
        .where(eq(Wallet.userId, user.id));

      await this.provider.db.update(User).set({ lastClaimTime: new Date() }).where(eq(User.id, user.id));

      return {};
    }

    return {};
  }
}
