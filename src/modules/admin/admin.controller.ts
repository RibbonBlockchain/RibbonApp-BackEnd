import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { AdminService } from './admin.service';
import { VERSION_ONE } from '@/core/constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReqUser } from '../auth/decorators/user.decorator';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors, Version } from '@nestjs/common';

@Controller('/admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Version(VERSION_ONE)
  @Get('/report/activities/user/:id/questionnaire')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetUserQuestionnaireReport(@Param('id') id: number) {
    const data = await this.admin.HttpHandleGetUserQuestionnaireReport(id);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/report/activities/user/:id/survey')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetUserSurveyReport(@Param('id') id: number) {
    const data = await this.admin.HttpHandleGetUserSurveyReport(id);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/report/activities/user/:id/task')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetUserTaskReport(@Param('id') id: number) {
    const data = await this.admin.HttpHandleGetUserTaskReport(id);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/report/activities')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetUsersActivitiesReports(@Query() query: Dto.GetUsersActivitiesReportsQuery) {
    const data = await this.admin.HttpHandleGetUsersActivitiesReports(query);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/report/activities/questionnaire')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetQuestionnaireActivityReports() {
    const data = await this.admin.HttpHandleGetQuestionnaireActivityReports();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/report/activities/survey')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetSurveyActivityReports() {
    const data = await this.admin.HttpHandleGetSurveyActivityReports();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/report/activities/task')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetTaskActivityReports() {
    const data = await this.admin.HttpHandleGetTaskActivityReports();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/report/users')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetUserReports() {
    const data = await this.admin.HttpHandleGetUserReports();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/report/rewards')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetRewardReports() {
    const data = await this.admin.HttpHandleGetUserReports();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/report/downloads')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleDownloadReport(@ReqUser() user: TUser) {
    const data = await this.admin.HttpHandleDownloadReport(user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/dashboard/summary')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetDashboardSummary() {
    const data = await this.admin.HttpHandleGetDashboardSummary();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/rating/overview')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetRatingsDistribution(@Query() query: { type: 's' | 't' | 'q' }) {
    const data = await this.admin.HttpHandleRatingOverview(query.type);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/cpi/upload')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  @UseInterceptors(FileInterceptor('file', { preservePath: true, dest: 'uploads' }))
  async uploadCpiData(@UploadedFile() file: Express.Multer.File, @ReqUser() user: TUser) {
    const data = await this.admin.HttpHandleUploadCpi(file, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/cpi')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getCpiData(@Query() query: { year: string }) {
    const data = await this.admin.HttpHandleGetCpiData(query.year);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/cpi-history')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getCpiHistory() {
    const data = await this.admin.HttpHandleGetCpiHistory();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/reward-partner/:id/wallet')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleCreateRewardPartnerWallet(@Param('id') id: number) {
    const data = await this.admin.HttpHandleCreateRewardPartnerWallet(id);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/reward-partner/:id/payout')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleRewardPartnerMassPayout(
    @ReqUser() user: TUser,
    @Param('id') id: number,
    @Body() body: Dto.MassTransferBody,
  ) {
    const data = await this.admin.HttpHandlRewardPartnerMassPayout(id, body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/reward-partner/:id')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetRewardPartnerById(@Param('id') id: number) {
    const data = await this.admin.HttpHandleGetRewardPartnerById(id);
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
  @Get('/notifications')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleGetNotifications(@ReqUser() user: TUser, @Query() query: Dto.GetAllNotificationsQuery) {
    const data = await this.admin.HttpHandleGetNotifications(query, user);
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

  @Version(VERSION_ONE)
  @Post('/create-vault')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleCreateVault(@Body() body: Dto.AdminCreateVaultBody, @ReqUser() user: TUser | undefined) {
    const data = await this.admin.HttpHandleCreateVault(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/wallet-transfer')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleWalletTransfer(@Body() body: Dto.AdminWalletTransferBody, @ReqUser() user: TUser | undefined) {
    const data = await this.admin.HttpHandleWalletTransfer(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/wallet/history')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleWalletHistory(@Query() query: Dto.GetBlockTransactions) {
    const data = await this.admin.HttpHandleWalletHistory(query);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/wallet/claimed-points')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleWalletClaimedPoints(@Query() query: Dto.GetTotalClaimedPoints) {
    const data = await this.admin.HttpHandleWalletClaimedPoints(query);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/wallet/balance')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async HttpHandleWalletBalance(@ReqUser() reqUser: TUser, @Query() query: Dto.GetWalletBalance) {
    const data = await this.admin.HttpHandleWalletBalance(query, reqUser);
    return { data, message: RESPONSE.SUCCESS };
  }
}
