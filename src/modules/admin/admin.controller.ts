import * as Dto from './dto';
import { RESPONSE } from '@/core/responses';
import { AdminService } from './admin.service';
import { VERSION_ONE } from '@/core/constants';
import { Body, Controller, Post, Version } from '@nestjs/common';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { ReqUser } from '../auth/decorators/user.decorator';
import { TUser } from '../drizzle/schema';

@Controller('/admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Post('/login')
  @Version(VERSION_ONE)
  async HttpHandleLogin(@Body() body: Dto.AdminLoginBody) {
    const data = await this.admin.HttpHandleLogin(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Post('/logout')
  @Version(VERSION_ONE)
  async HttpHandleLogout(@ReqUser() user: TUser) {
    const data = await this.admin.HttpHandleLogout(user);
    return { data, message: RESPONSE.SUCCESS };
  }
}
