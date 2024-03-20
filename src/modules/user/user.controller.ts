import { Body, Controller, Post, Version } from '@nestjs/common';
import { UserService } from './user.service';
import { HandlePhoneVerification, HandleVerifyPhone } from './dto/request';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { TUser } from '../drizzle/schema';
import { ReqUser } from '../auth/decorators/user.decorator';
import { VERSION_ONE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Version(VERSION_ONE)
  @Post('/phone/change')
  async HttpHandlePhoneVerification(@Body() body: HandlePhoneVerification) {
    const data = await this.userService.HttpHandlePhoneVerification(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @AuthGuard()
  @Post('/phone/verify')
  async HttpHandleVerifyPhone(@Body() body: HandleVerifyPhone, @ReqUser() user: TUser) {
    const data = await this.userService.HttpHandleVerifyPhone(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }
}
