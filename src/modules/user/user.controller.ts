import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { UserService } from './user.service';
import { VERSION_ONE } from '@/core/constants';
import { ReqUser } from '../auth/decorators/user.decorator';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { Body, Controller, Patch, Post, Version } from '@nestjs/common';

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
  @Version(VERSION_ONE)
  @Post('/claim')
  async HttpClaimDailyReward(@ReqUser() user: TUser) {
    const data = await this.userService.HttpHandleClaimDailyReward(user);
    return { data, message: RESPONSE.SUCCESS };
  }
}
