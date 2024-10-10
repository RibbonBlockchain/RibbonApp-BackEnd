import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { UserService } from './user.service';
import { VERSION_ONE } from '@/core/constants';
import { ReqUser } from '../auth/decorators/user.decorator';
import { BaseClaimBody, ClaimPointBody, GetTransactionsBody, SwapPointBody, WithdrawPointBody } from '../contract/dto';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { Body, Controller, Get, Patch, Post, Version } from '@nestjs/common';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Version(VERSION_ONE)
  @Post('/phone/change')
  async HttpHandlePhoneVerification(@Body() body: Dto.HandlePhoneVerification) {
    const data = await this.userService.HttpHandlePhoneVerification(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/phone/verify')
  async HttpHandleVerifyPhone(@Body() body: Dto.HandleVerifyPhone, @ReqUser() user: TUser) {
    const data = await this.userService.HttpHandleVerifyPhone(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Patch('/profile')
  @Version(VERSION_ONE)
  async HttpHandleUpdateProfile(@Body() body: Dto.HandleUpdateProfile, @ReqUser() user: TUser) {
    const data = await this.userService.HttpHandleUpdateProfile(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Post('/claim')
  @Version(VERSION_ONE)
  async HttpClaimDailyReward(@ReqUser() user: TUser) {
    const data = await this.userService.HttpHandleClaimDailyReward(user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/claim-point')
  async HttpClaimPoint(@Body() body: ClaimPointBody, @ReqUser() user: TUser) {
    const data = await this.userService.HttpHandleClaimPoint(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/swap-point')
  async HttpSwapPoint(@Body() body: SwapPointBody, @ReqUser() user: TUser) {
    const data = await this.userService.HttpHandleSwapPoint(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/withdraw-point')
  async HttpWithdrawPoint(@Body() body: WithdrawPointBody, @ReqUser() user: TUser) {
    const data = await this.userService.HttpHandleWithdrawPoint(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Get('/notification')
  async HttpHandleGetUserNotifications(@ReqUser() user: TUser) {
    const data = await this.userService.HttpHandleGetUserNotifications(user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Post('/base-claim')
  @Version(VERSION_ONE)
  async baseClaim(@Body() body: BaseClaimBody) {
    const data = await this.userService.baseClaim(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/transactions')
  async getTransactions(@Body() body: GetTransactionsBody) {
    const data = await this.userService.getTransactions(body);
    return { data, message: RESPONSE.SUCCESS };
  }
}
