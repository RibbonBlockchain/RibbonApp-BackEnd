import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { AuthService } from './auth.service';
import { VERSION_ONE } from '@/core/constants';
import { ReqUser } from './decorators/user.decorator';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { Body, Controller, Get, Patch, Post, Version } from '@nestjs/common';

@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('/')
  @AuthGuard()
  @Version(VERSION_ONE)
  async HttpHandleGetAuth(@ReqUser() user: TUser) {
    const data = await this.auth.HttpHandleGetAuth(user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Post('/phone/check')
  @Version(VERSION_ONE)
  async HttpHandleCheckPhone(@Body() body: Dto.HandleCheckPhone) {
    const data = await this.auth.HttpHandleCheckPhone(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Patch('/pin')
  @Version(VERSION_ONE)
  async HttpHandleChangePin(@ReqUser() user: TUser, @Body() body: Dto.HandleChangePin) {
    const data = await this.auth.HttpHandleChangePin(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Post('/pin/forgot')
  @Version(VERSION_ONE)
  async HttpHandleForgotPin(@Body() body: Dto.HandleForgotPin) {
    const data = await this.auth.HttpHandleForgotPin(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/pin/forgot/verify')
  async HttpHandleVerifyForgotPin(@Body() body: Dto.HandleVerifyForgotPin) {
    const data = await this.auth.HttpHandleVerifyForgotPin(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Post('/login/phone')
  @Version(VERSION_ONE)
  async HttpHandlePhoneLogin(@Body() body: Dto.HandlePhoneLogin) {
    const data = await this.auth.HttpHandlePhoneLogin(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/login/world-id')
  async HttpHandleWorldIdLogin(@Body() body: Dto.HandleWorldIdLogin) {
    const data = await this.auth.HttpHandleWorldIdLogin(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Post('/logout')
  @Version(VERSION_ONE)
  async HttpHandleLogout(@ReqUser() user: TUser | undefined) {
    const data = await this.auth.HttpHandleLogout(user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/signup/phone/request')
  async HttpHandlePhoneSignUp(@Body() body: Dto.HandlePhoneSignUp) {
    const data = await this.auth.HttpHandlePhoneSignUp(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/signup/phone/verify')
  async HttpHandleVerifyPhoneSignUp(@Body() body: Dto.VerifyPhoneSignUp) {
    const data = await this.auth.HttpHandleVerifyPhoneSignUp(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/signup/phone/pin')
  async HttpHandlePhoneOnboard(@Body() body: Dto.PhoneOnboard) {
    const data = await this.auth.HttpHandlePhoneOnboard(body);
    return { data, message: RESPONSE.SUCCESS };
  }
}
