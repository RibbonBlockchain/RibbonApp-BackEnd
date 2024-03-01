import * as Dto from './dto';
import { RESPONSE } from '@/core/responses';
import { AuthService } from './auth.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('/onboard/otp/request')
  async HttpHandleRequestOnboardingOTP(@Body() body: Dto.RequestOnboardingOTP) {
    const data = await this.auth.HttpHandleRequestOnboardingOTP(body);
    return { data, message: RESPONSE.SUCCESS };
  }
}
