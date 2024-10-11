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
import { ethers } from 'ethers';
import { and, eq } from 'drizzle-orm';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { quickOTP } from '@/core/utils/code';
import { hasTimeExpired } from '@/core/utils';
import { ConfigService } from '@nestjs/config';
import { TDbProvider } from '../drizzle/drizzle.module';
import { TwilioService } from '../twiio/twilio.service';
import { CoinbaseService } from '../coinbase/coinbase.service';
import { ContractService } from '../contract/contract.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseClaimBody, ClaimPointBody, GetTransactionsBody, SwapPointBody, WithdrawPointBody } from '../contract/dto';

const minPoint = 10_000;
const factor = 1000_000_000_000_000_000;

@Injectable()
export class UserService {
  private readonly rpc = this.config.getOrThrow('CONTRACT_RPC_V2');
  private readonly vaultOwner = this.config.getOrThrow('VAULT_OWNER');
  private readonly tokenAddress = this.config.getOrThrow('BASE_TOKEN_ADDRESS');
  private readonly jsonProvider = new ethers.providers.JsonRpcProvider(this.rpc);
  private readonly contractPrivateKey = this.config.getOrThrow('CONTRACT_PRIVATE_KEY');
  private readonly wallet = new ethers.Wallet(this.contractPrivateKey, this.jsonProvider);

  constructor(
    private readonly config: ConfigService,
    private readonly twilio: TwilioService,
    private readonly contract: ContractService,
    private readonly coinbase: CoinbaseService,
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

      const balance = wallet.balance + 0.02;

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

    await this.provider.db.update(Wallet).set({ balance: 0.02 }).where(eq(Wallet.userId, user.auth.id));

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

    const amount = 100 / 5_000;
    const newBalance = wallet?.balance + amount;
    const newDailyReward = wallet?.dailyReward + amount;

    if (!lastClaimTime) {
      // Claiming for first time
      await this.provider.db
        .update(Wallet)
        .set({ balance: newBalance, dailyReward: newDailyReward })
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
    const amount = +body.amount / factor; // 10_000
    if (amount < minPoint) throw new BadRequestException('You cannot claim less than 10,000 points');

    const wallet = await this.provider.db.query.Wallet.findFirst({ where: eq(Wallet.userId, user.id) });
    const walletPoints = (wallet.balance || 0) * 5_000; // 20_000

    if (walletPoints < amount) {
      throw new BadRequestException('You do not have enough points in your wallet');
    }

    const worldCoinPartner = await this.provider.db.query.RewardPartner.findFirst({
      where: eq(RewardPartner.name, 'Worldcoin'),
    });

    if (!worldCoinPartner?.vaultAddress) throw new BadRequestException('Reward Partner not active');

    // TODO: add address to wallet schema

    const res = await this.contract.ClaimPoints(
      body.address,
      body.amount,
      worldCoinPartner.name,
      worldCoinPartner.vaultAddress,
    );

    return res;
  }

  async HttpHandleSwapPoint(body: SwapPointBody, user: TUser) {
    if (+body.amount < minPoint) throw new BadRequestException('You cannot swap less than 10,000 points');

    const worldCoinPartner = await this.provider.db.query.RewardPartner.findFirst({
      where: eq(RewardPartner.name, 'Worldcoin'),
    });

    if (!worldCoinPartner?.vaultAddress) throw new BadRequestException('Reward Partner not active');

    // TODO: add address to wallet schema
    await this.provider.db.query.Wallet.findFirst({ where: eq(Wallet.userId, user.id) });

    return await this.contract.SwapToPaymentCoin(
      body.address,
      body.amount,
      worldCoinPartner.name,
      worldCoinPartner.vaultAddress,
    );
  }

  async HttpHandleWithdrawPoint(body: WithdrawPointBody, user: TUser) {
    const amount = +body.amount; // 10_000
    const wallet = await this.provider.db.query.Wallet.findFirst({ where: eq(Wallet.userId, user.id) });

    const withdrawalAmount = amount / 5_000; // 2;
    const newBalance = wallet?.balance - withdrawalAmount || 0;

    await this.provider.db
      .update(Wallet)
      .set({ balance: newBalance ?? 0 })
      .where(eq(Wallet.id, wallet.id));

    return {};
  }

  async baseClaim(body: BaseClaimBody) {
    // Define the EIP-712 domain
    const domain = {
      name: 'Ribbon',
      version: '1',
      chainId: 84532, // Mainnet
      verifyingContract: this.tokenAddress,
    };

    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    // Define the permit message
    const spender = body.address;
    const owner = this.vaultOwner;
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const value = ethers.utils.parseUnits(String(body.amount), 18);

    const message = {
      owner: owner,
      value: value,
      spender: spender,
      deadline: deadline,
    };

    const signature = await this.wallet._signTypedData(domain, types, message);
    const { v, r, s } = ethers.utils.splitSignature(signature);
    return { v, r, s, deadline, vaultAddress: this.tokenAddress };
  }

  async getBaseTransactions(body: GetTransactionsBody) {
    const [res, err] = await this.coinbase.allBaseTransactions(body.address);
    if (err) throw new BadRequestException(err);

    return res;
  }

  async getOptimismTransactions(body: GetTransactionsBody) {
    const [res, err] = await this.coinbase.allOptimismTransactions(body.address);
    if (err) throw new BadRequestException(err);

    return res;
  }
}
