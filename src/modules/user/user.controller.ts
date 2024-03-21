import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { UserService } from './user.service';
import { VERSION_ONE } from '@/core/constants';
import { ReqUser } from '../auth/decorators/user.decorator';
import { Body, Controller, Post, Version } from '@nestjs/common';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { HandlePhoneVerification, HandleVerifyPhone } from './dto/request';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Version(VERSION_ONE)
  @Post('/phone/change')
  async HttpHandlePhoneVerification(@Body() body: HandlePhoneVerification) {
    const data = await this.userService.HttpHandlePhoneVerification(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/phone/verify')
  async HttpHandleVerifyPhone(@Body() body: HandleVerifyPhone, @ReqUser() user: TUser) {
    const data = await this.userService.HttpHandleVerifyPhone(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }
}
