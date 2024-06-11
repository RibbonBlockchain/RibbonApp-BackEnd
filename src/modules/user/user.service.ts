import {
  User,
  TUser,
  Wallet,
  Notification,
  Questionnaire,
  VerificationCode,
  QuestionnaireActivity,
  RewardPartner,
} from '../drizzle/schema';
import * as Dto from './dto';
import { and, eq } from 'drizzle-orm';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { quickOTP } from '@/core/utils/code';
import { hasTimeExpired } from '@/core/utils';
import { TDbProvider } from '../drizzle/drizzle.module';
import { TwilioService } from '../twiio/twilio.service';
import { ContractService } from '../contract/contract.service';
import { ClaimPointBody, SwapPointBody } from '../contract/dto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

const minPoint = 10_000;
const factor = 1000_000_000_000_000_000;

@Injectable()
export class UserService {
  constructor(
    private readonly twilio: TwilioService,
    private readonly contract: ContractService,
    @Inject(DATABASE) private readonly provider: TDbProvider,
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

      const task = await this.provider.db.query.Questionnaire.findFirst({
        where: eq(Questionnaire.name, 'Complete your profile'),
      });

      if (task) {
        await this.provider.db
          .insert(QuestionnaireActivity)
          .values({ taskId: task.id, userId: user.id, status: 'COMPLETED' });
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
        .set({ balance: wallet.balance + 0.02 })
        .where(eq(Wallet.userId, user.id));

      await this.provider.db
        .update(User)
        .set({ lastClaimTime: new Date(), numberOfClaims: userData.numberOfClaims + 1 })
        .where(eq(User.id, user.id));

      await this.provider.db
        .insert(QuestionnaireActivity)
        .values({ userId: user.id, completedDate: new Date().toISOString(), type: 'DAILY_REWARD', status: 'COMPLETED' })
        .execute();

      return {};
    }

    if (lastClaimTime && lastClaimTime < twelveHoursAgo) {
      await this.provider.db
        .update(Wallet)
        .set({ balance: wallet.balance + 0.02 })
        .where(eq(Wallet.userId, user.id));

      await this.provider.db
        .update(User)
        .set({ lastClaimTime: new Date(), numberOfClaims: userData.numberOfClaims + 1 })
        .where(eq(User.id, user.id));

      await this.provider.db
        .insert(QuestionnaireActivity)
        .values({ userId: user.id, completedDate: new Date().toISOString(), type: 'DAILY_REWARD', status: 'COMPLETED' })
        .execute();

      return {};
    }

    return {};
  }

  async HttpHandleGetUserNotifications(user: TUser) {
    const notification = await this.provider.db.query.Notification.findMany({
      where: eq(Notification.userId, user.id),
    });

    return { data: notification };
  }

  async HttpHandleClaimPoint(body: ClaimPointBody, user: TUser) {
    const amount = +body.amount / factor;
    if (amount < minPoint) throw new BadRequestException('You cannot claim less than 10,000 points');

    const wallet = await this.provider.db.query.Wallet.findFirst({ where: eq(Wallet.userId, user.id) });

    if (wallet.point < amount) {
      throw new BadRequestException('You do not have enough points in your wallet');
    }

    const worldCoinPartner = await this.provider.db.query.RewardPartner.findFirst({
      where: eq(RewardPartner.name, 'Worldcoin-1'),
    });

    if (!worldCoinPartner?.vaultAddress) throw new BadRequestException('Reward Partner not active');

    // TODO: add address to wallet schema

    const newPointBalance = wallet?.point - amount;
    const newBalance = newPointBalance * 5_000;

    await this.contract.claimPoints(body.address, body.amount, worldCoinPartner.vaultAddress);
    await this.provider.db
      .update(Wallet)
      .set({ point: newPointBalance, balance: newBalance })
      .where(eq(Wallet.id, wallet.id));

    return {};
  }

  async HttpHandleSwapPoint(body: SwapPointBody, user: TUser) {
    if (+body.amount < minPoint) throw new BadRequestException('You cannot swap less than 10,000 points');

    const worldCoinPartner = await this.provider.db.query.RewardPartner.findFirst({
      where: eq(RewardPartner.name, 'Worldcoin-1'),
    });

    if (!worldCoinPartner?.vaultAddress) throw new BadRequestException('Reward Partner not active');

    // TODO: add address to wallet schema
    await this.provider.db.query.Wallet.findFirst({ where: eq(Wallet.userId, user.id) });

    await this.contract.swapToPaymentCoin(body.address, body.amount, worldCoinPartner.vaultAddress);
    return {};
  }
}
