import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { AdminService } from './admin.service';
import { VERSION_ONE } from '@/core/constants';
import { ReqUser } from '../auth/decorators/user.decorator';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { Body, Controller, Get, Post, Query, Version } from '@nestjs/common';

@Controller('/admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Version(VERSION_ONE)
  @Get('/dashboard/summary')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetDashboardSummary() {
    const data = await this.admin.HttpHandleGetDashboardSummary();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/reward-partner')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetRewardPartners(@Query() query: Dto.GetRewardPartners) {
    const data = await this.admin.HttpHandleGetRewardPartners(query);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/password/change')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleChangePassword(@ReqUser() user: TUser, @Body() body: Dto.AdminChangePasswordBody) {
    const data = await this.admin.HttpHandleChangePassword(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Post('/login')
  @Version(VERSION_ONE)
  async HttpHandleLogin(@Body() body: Dto.AdminLoginBody) {
    const data = await this.admin.HttpHandleLogin(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Post('/logout')
  @Version(VERSION_ONE)
  async HttpHandleLogout(@ReqUser() user: TUser | undefined) {
    const data = await this.admin.HttpHandleLogout(user);
    return { data, message: RESPONSE.SUCCESS };
  }
}
