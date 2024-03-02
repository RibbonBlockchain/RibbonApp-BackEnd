import * as Dto from './dto';
import { RESPONSE } from '@/core/responses';
import { AuthService } from './auth.service';
import { VERSION_ONE } from '@/core/constants';
import { Body, Controller, Post, Version } from '@nestjs/common';

@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Version(VERSION_ONE)
  @Post('/onboard/otp/request')
  async HttpHandleRequestOnboardingOTP(@Body() body: Dto.RequestOnboardingOTP) {
    const data = await this.auth.HttpHandleRequestOnboardingOTP(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/onboard/otp/verify')
  async HttpHandleVerifyOnboardingOTP(@Body() body: Dto.VerifyOnboardingOTP) {
    const data = await this.auth.HttpHandleVerifyOnboardingOTP(body);
    return { data, message: RESPONSE.SUCCESS };
  }
}
