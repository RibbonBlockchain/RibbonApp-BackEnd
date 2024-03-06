import * as Dto from './dto';
import { RESPONSE } from '@/core/responses';
import { AuthService } from './auth.service';
import { VERSION_ONE } from '@/core/constants';
import { Body, Controller, Post, Version } from '@nestjs/common';

@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('/phone')
  @Version(VERSION_ONE)
  async HttpHandlePhoneAuth(@Body() body: Dto.HandlePhoneAuth) {
    const data = await this.auth.HttpHandlePhoneAuth(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/phone/verify')
  async HttpHandleVerifyPhoneAuthOTP(@Body() body: Dto.VerifyPhoneAuthOTP) {
    const data = await this.auth.HttpHandleVerifyPhoneAuthOTP(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/phone/onboard')
  async HttpHandlePhoneOnboard(@Body() body: Dto.PhoneOnboard) {
    const data = await this.auth.HttpHandlePhoneOnboard(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Post('/pin/verify')
  @Version(VERSION_ONE)
  async HttpHandleVerifyAuthPin(@Body() body: Dto.VerifyAuthPin) {
    const data = await this.auth.HttpHandleVerifyAuthPin(body);
    return { data, message: RESPONSE.SUCCESS };
  }
}
