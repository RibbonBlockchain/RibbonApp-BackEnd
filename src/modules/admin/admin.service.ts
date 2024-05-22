import {
  Auth,
  User,
  TUser,
  Tassk,
  Answer,
  Survey,
  Wallet,
  TasskRating,
  SurveyRating,
  Notification,
  Questionnaire,
  RewardPartner,
  TasskActivity,
  SurveyActivity,
  QuestionnaireRating,
  TasskQuestionAnswer,
  SurveyQuestionAnswer,
  QuestionnaireActivity,
} from '../drizzle/schema';
import * as Dto from './dto';
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import { RESPONSE } from '@/core/responses';
import { DATABASE } from '@/core/constants';
import { endOfDay, oneYearAgo } from '@/core/utils';
import { MailerService } from '@nestjs-modules/mailer';
import { TDbProvider } from '../drizzle/drizzle.module';
import { ArgonService } from '@/core/services/argon.service';
import { TokenService } from '@/core/services/token.service';
import { generatePagination, getPage } from '@/core/utils/page';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, count, countDistinct, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';

@Injectable()
export class AdminService {
  constructor(
    private readonly token: TokenService,
    private readonly mailer: MailerService,
    private readonly argon: ArgonService,
    @Inject(DATABASE) private readonly provider: TDbProvider,
  ) {}

  async HttpHandleLogout(user: TUser | undefined) {
    if (!user) return {};

    await this.provider.db.update(Auth).set({ accessToken: null, refreshToken: null }).where(eq(Auth.userId, user.id));
    return {};
  }

  async HttpHandleGetNotifications({ q, page, pageSize }: Dto.GetAllNotificationsQuery) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const queryFilter = q
      ? or(ilike(Notification.message, searchQuery), ilike(Notification.title, searchQuery))
      : undefined;

    return await this.provider.db.query.Notification.findMany({
      limit,
      offset,
      where: queryFilter,
      with: { user: true, sender: true },
      orderBy: desc(Notification.updatedAt),
    });
  }

  async HttpHandleDownloadReport(admin: TUser) {
    const users = await this.provider.db
      .select({
        'User ID': User.id,
        'User Location': User.phone,
        'User SES Score': Wallet.point,
        'Total Rewards Earned': Wallet.balance,
        'Daily Rewards Earned': User.numberOfClaims,
        'Questionnaires Completed': countDistinct(QuestionnaireActivity.id),
        'Surveys Completed': countDistinct(SurveyActivity.id),
        'Tasks Completed': countDistinct(TasskActivity.id),
        'Total Ratings': countDistinct(QuestionnaireRating.id),
      })
      .from(User)
      .leftJoin(Wallet, eq(User.id, Wallet.userId))
      .leftJoin(TasskRating, eq(User.id, TasskRating.userId))
      .leftJoin(SurveyRating, eq(User.id, SurveyRating.userId))
      .leftJoin(QuestionnaireRating, eq(User.id, QuestionnaireRating.userId))
      .leftJoin(TasskActivity, and(eq(User.id, TasskActivity.userId), eq(TasskActivity.status, 'COMPLETED')))
      .leftJoin(SurveyActivity, and(eq(User.id, SurveyActivity.userId), eq(SurveyActivity.status, 'COMPLETED')))
      .leftJoin(
        QuestionnaireActivity,
        and(eq(User.id, QuestionnaireActivity.userId), eq(QuestionnaireActivity.status, 'COMPLETED')),
      )
      .orderBy(User.id)
      .groupBy(User.id, Wallet.point, Wallet.balance, QuestionnaireActivity.userId);

    const worksheet = XLSX.utils.json_to_sheet(users);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dates');

    XLSX.writeFile(workbook, 'Reports.xlsx', { compression: true });
    const file = await fs.readFile('Reports.xlsx');

    await this.mailer.sendMail({
      to: admin.email,
      subject: `RibbonProtocol Report | ${new Date().toDateString()}`,
      text: 'The request report for Ribbon Protocol can be download below',
      from: process.env.EMAIL_USER,
      attachments: [
        {
          content: Buffer.from(file.buffer),
          filename: `RibbonProtocolReport-${new Date().getTime()}.xlsx`,
          contentDisposition: 'attachment',
        },
      ],
    });

    return {};
  }

  async HttpHandleGetQuestionnaireActivityReports() {
    let pending: any[] = [];
    let completed: any[] = [];

    const months = [
      { id: 'Jan', name: 'January', completed: 0, pending: 0 },
      { id: 'Feb', name: 'February', completed: 0, pending: 0 },
      { id: 'Mar', name: 'March', completed: 0, pending: 0 },
      { id: 'Apr', name: 'April', completed: 0, pending: 0 },
      { id: 'May', name: 'May', completed: 0, pending: 0 },
      { id: 'Jun', name: 'June', completed: 0, pending: 0 },
      { id: 'Jul', name: 'July', completed: 0, pending: 0 },
      { id: 'Aug', name: 'August', completed: 0, pending: 0 },
      { id: 'Sep', name: 'September', completed: 0, pending: 0 },
      { id: 'Oct', name: 'October', completed: 0, pending: 0 },
      { id: 'Nov', name: 'November', completed: 0, pending: 0 },
      { id: 'Dec', name: 'December', completed: 0, pending: 0 },
    ];

    return await this.provider.db.transaction(async (tx) => {
      const [{ total }] = await tx.select({ total: count() }).from(QuestionnaireActivity);

      const [{ totalCompleted }] = await tx
        .select({ totalCompleted: count() })
        .from(QuestionnaireActivity)
        .where(eq(QuestionnaireActivity.status, 'COMPLETED'));

      const completionRate = (totalCompleted / total) * 100;

      const now = new Date();
      const min = new Date(oneYearAgo());
      const max = new Date(endOfDay(now.toISOString()));

      pending = await tx
        .select({
          count: count(),
          month: sql`to_char(${QuestionnaireActivity.updatedAt}, 'Month')`,
        })
        .from(QuestionnaireActivity)
        .groupBy(sql`to_char(${QuestionnaireActivity.updatedAt}, 'Month')`)
        .where(
          and(
            gte(QuestionnaireActivity.updatedAt, min),
            lte(QuestionnaireActivity.updatedAt, max),
            eq(QuestionnaireActivity.status, 'PROCESSING'),
          ),
        );

      completed = await tx
        .select({
          count: count(),
          month: sql`to_char(${QuestionnaireActivity.updatedAt}, 'Month')`,
        })
        .from(QuestionnaireActivity)
        .groupBy(sql`to_char(${QuestionnaireActivity.updatedAt}, 'Month')`)
        .where(
          and(
            gte(QuestionnaireActivity.updatedAt, min),
            lte(QuestionnaireActivity.updatedAt, max),
            eq(QuestionnaireActivity.status, 'COMPLETED'),
          ),
        );

      pending.forEach((val) => {
        const index = months.findIndex((x) => x.name === val.month?.trim());
        months[index].pending = val.count;
      });

      completed.forEach((val) => {
        const index = months.findIndex((x) => x.name === val.month?.trim());
        months[index].completed = val.count;
      });

      return {
        total,
        data: months,
        pending: total - totalCompleted,
        averageCompletionRate: completionRate,
      };
    });
  }

  async HttpHandleGetSurveyActivityReports() {
    let pending: any[] = [];
    let completed: any[] = [];

    const months = [
      { id: 'Jan', name: 'January', completed: 0, pending: 0 },
      { id: 'Feb', name: 'February', completed: 0, pending: 0 },
      { id: 'Mar', name: 'March', completed: 0, pending: 0 },
      { id: 'Apr', name: 'April', completed: 0, pending: 0 },
      { id: 'May', name: 'May', completed: 0, pending: 0 },
      { id: 'Jun', name: 'June', completed: 0, pending: 0 },
      { id: 'Jul', name: 'July', completed: 0, pending: 0 },
      { id: 'Aug', name: 'August', completed: 0, pending: 0 },
      { id: 'Sep', name: 'September', completed: 0, pending: 0 },
      { id: 'Oct', name: 'October', completed: 0, pending: 0 },
      { id: 'Nov', name: 'November', completed: 0, pending: 0 },
      { id: 'Dec', name: 'December', completed: 0, pending: 0 },
    ];

    return await this.provider.db.transaction(async (tx) => {
      const [{ total }] = await tx.select({ total: count() }).from(SurveyActivity);

      const [{ totalCompleted }] = await tx
        .select({ totalCompleted: count() })
        .from(SurveyActivity)
        .where(eq(SurveyActivity.status, 'COMPLETED'));

      const completionRate = (totalCompleted / total) * 100;

      const now = new Date();
      const min = new Date(oneYearAgo());
      const max = new Date(endOfDay(now.toISOString()));

      pending = await tx
        .select({
          count: count(),
          month: sql`to_char(${SurveyActivity.updatedAt}, 'Month')`,
        })
        .from(SurveyActivity)
        .groupBy(sql`to_char(${SurveyActivity.updatedAt}, 'Month')`)
        .where(
          and(
            lte(SurveyActivity.updatedAt, max),
            gte(SurveyActivity.updatedAt, min),
            eq(SurveyActivity.status, 'PROCESSING'),
          ),
        );

      completed = await tx
        .select({
          count: count(),
          month: sql`to_char(${SurveyActivity.updatedAt}, 'Month')`,
        })
        .from(SurveyActivity)
        .groupBy(sql`to_char(${SurveyActivity.updatedAt}, 'Month')`)
        .where(
          and(
            lte(SurveyActivity.updatedAt, max),
            gte(SurveyActivity.updatedAt, min),
            eq(SurveyActivity.status, 'COMPLETED'),
          ),
        );

      pending.forEach((val) => {
        const index = months.findIndex((x) => x.name === val.month?.trim());
        months[index].pending = val.count;
      });

      completed.forEach((val) => {
        const index = months.findIndex((x) => x.name === val.month?.trim());
        months[index].completed = val.count;
      });

      return {
        total,
        data: months,
        pending: total - totalCompleted,
        averageCompletionRate: completionRate,
      };
    });
  }

  async HttpHandleGetTaskActivityReports() {
    let pending: any[] = [];
    let completed: any[] = [];

    const months = [
      { id: 'Jan', name: 'January', completed: 0, pending: 0 },
      { id: 'Feb', name: 'February', completed: 0, pending: 0 },
      { id: 'Mar', name: 'March', completed: 0, pending: 0 },
      { id: 'Apr', name: 'April', completed: 0, pending: 0 },
      { id: 'May', name: 'May', completed: 0, pending: 0 },
      { id: 'Jun', name: 'June', completed: 0, pending: 0 },
      { id: 'Jul', name: 'July', completed: 0, pending: 0 },
      { id: 'Aug', name: 'August', completed: 0, pending: 0 },
      { id: 'Sep', name: 'September', completed: 0, pending: 0 },
      { id: 'Oct', name: 'October', completed: 0, pending: 0 },
      { id: 'Nov', name: 'November', completed: 0, pending: 0 },
      { id: 'Dec', name: 'December', completed: 0, pending: 0 },
    ];

    return await this.provider.db.transaction(async (tx) => {
      const [{ total }] = await tx.select({ total: count() }).from(TasskActivity);

      const [{ totalCompleted }] = await tx
        .select({ totalCompleted: count() })
        .from(TasskActivity)
        .where(eq(TasskActivity.status, 'COMPLETED'));

      const completionRate = (totalCompleted / total) * 100;

      const now = new Date();
      const min = new Date(oneYearAgo());
      const max = new Date(endOfDay(now.toISOString()));

      pending = await tx
        .select({
          count: count(),
          month: sql`to_char(${TasskActivity.updatedAt}, 'Month')`,
        })
        .from(TasskActivity)
        .groupBy(sql`to_char(${TasskActivity.updatedAt}, 'Month')`)
        .where(
          and(
            gte(TasskActivity.updatedAt, min),
            lte(TasskActivity.updatedAt, max),
            eq(TasskActivity.status, 'PROCESSING'),
          ),
        );

      completed = await tx
        .select({
          count: count(),
          month: sql`to_char(${TasskActivity.updatedAt}, 'Month')`,
        })
        .from(TasskActivity)
        .groupBy(sql`to_char(${TasskActivity.updatedAt}, 'Month')`)
        .where(
          and(
            lte(TasskActivity.updatedAt, max),
            gte(TasskActivity.updatedAt, min),
            eq(TasskActivity.status, 'COMPLETED'),
          ),
        );

      pending.forEach((val) => {
        const index = months.findIndex((x) => x.name === val.month?.trim());
        months[index].pending = val.count;
      });

      completed.forEach((val) => {
        const index = months.findIndex((x) => x.name === val.month?.trim());
        months[index].completed = val.count;
      });

      return {
        total,
        data: months,
        pending: total - totalCompleted,
        averageCompletionRate: completionRate,
      };
    });
  }

  async HttpHandleGetUserReports() {
    let active: any[] = [];
    let inactive: any[] = [];

    const months = [
      { id: 'Jan', name: 'January', active: 0, inactive: 0 },
      { id: 'Feb', name: 'February', active: 0, inactive: 0 },
      { id: 'Mar', name: 'March', active: 0, inactive: 0 },
      { id: 'Apr', name: 'April', active: 0, inactive: 0 },
      { id: 'May', name: 'May', active: 0, inactive: 0 },
      { id: 'Jun', name: 'June', active: 0, inactive: 0 },
      { id: 'Jul', name: 'July', active: 0, inactive: 0 },
      { id: 'Aug', name: 'August', active: 0, inactive: 0 },
      { id: 'Sep', name: 'September', active: 0, inactive: 0 },
      { id: 'Oct', name: 'October', active: 0, inactive: 0 },
      { id: 'Nov', name: 'November', active: 0, inactive: 0 },
      { id: 'Dec', name: 'December', active: 0, inactive: 0 },
    ];

    return await this.provider.db.transaction(async (tx) => {
      const [{ total }] = await tx.select({ total: count() }).from(User);

      const [{ totalActive }] = await tx.select({ totalActive: count() }).from(User).where(eq(User.status, 'ACTIVE'));

      const now = new Date();
      const min = new Date(oneYearAgo());
      const max = new Date(endOfDay(now.toISOString()));

      inactive = await tx
        .select({
          count: count(),
          month: sql`to_char(${User.createdAt}, 'Month')`,
        })
        .from(User)
        .groupBy(sql`to_char(${User.createdAt}, 'Month')`)
        .where(and(gte(User.createdAt, min), lte(User.createdAt, max), eq(User.status, 'ONBOARDING')));

      active = await tx
        .select({
          count: count(),
          month: sql`to_char(${User.createdAt}, 'Month')`,
        })
        .from(User)
        .groupBy(sql`to_char(${User.createdAt}, 'Month')`)
        .where(and(gte(User.createdAt, min), lte(User.createdAt, max), eq(User.status, 'ACTIVE')));

      inactive.forEach((val) => {
        const index = months.findIndex((x) => x.name === val.month?.trim());
        months[index].inactive = val.count;
      });

      active.forEach((val) => {
        const index = months.findIndex((x) => x.name === val.month?.trim());
        months[index].active = val.count;
      });

      return {
        total,
        data: months,
        active: totalActive,
        inactive: total - totalActive,
      };
    });
  }

  async HttpHandleGetRewardReports() {
    let active: any[] = [];
    let inactive: any[] = [];

    const months = [
      { id: 'Jan', name: 'January', outflow: 0, inflow: 0 },
      { id: 'Feb', name: 'February', outflow: 0, inflow: 0 },
      { id: 'Mar', name: 'March', outflow: 0, inflow: 0 },
      { id: 'Apr', name: 'April', outflow: 0, inflow: 0 },
      { id: 'May', name: 'May', outflow: 0, inflow: 0 },
      { id: 'Jun', name: 'June', outflow: 0, inflow: 0 },
      { id: 'Jul', name: 'July', outflow: 0, inflow: 0 },
      { id: 'Aug', name: 'August', outflow: 0, inflow: 0 },
      { id: 'Sep', name: 'September', outflow: 0, inflow: 0 },
      { id: 'Oct', name: 'October', outflow: 0, inflow: 0 },
      { id: 'Nov', name: 'November', outflow: 0, inflow: 0 },
      { id: 'Dec', name: 'December', outflow: 0, inflow: 0 },
    ];

    return await this.provider.db.transaction(async (tx) => {
      const [{ total }] = await tx.select({ total: count() }).from(User);

      const [{ totalActive }] = await tx.select({ totalActive: count() }).from(User).where(eq(User.status, 'ACTIVE'));

      const now = new Date();
      const min = new Date(oneYearAgo());
      const max = new Date(endOfDay(now.toISOString()));

      inactive = await tx
        .select({
          count: count(),
          month: sql`to_char(${User.createdAt}, 'Month')`,
        })
        .from(User)
        .groupBy(sql`to_char(${User.createdAt}, 'Month')`)
        .where(and(gte(User.createdAt, min), lte(User.createdAt, max), eq(User.status, 'ONBOARDING')));

      active = await tx
        .select({
          count: count(),
          month: sql`to_char(${User.createdAt}, 'Month')`,
        })
        .from(User)
        .groupBy(sql`to_char(${User.createdAt}, 'Month')`)
        .where(and(gte(User.createdAt, min), lte(User.createdAt, max), eq(User.status, 'ACTIVE')));

      inactive.forEach((val) => {
        const index = months.findIndex((x) => x.name === val.month?.trim());
        months[index].inflow = val.count;
      });

      active.forEach((val) => {
        const index = months.findIndex((x) => x.name === val.month?.trim());
        months[index].outflow = val.count;
      });

      return {
        total,
        data: months,
        inflow: totalActive,
        outflow: total - totalActive,
      };
    });
  }

  async HttpHandleGetDashboardSummary() {
    return await this.provider.db.transaction(async (tx) => {
      const [
        [{ task }],
        [{ survey }],
        [{ questionnaire }],
        [{ taskResponse }],
        [{ surveyResponse }],
        [{ questionnaireResponse }],
        [{ totalTaskActivities }],
        [{ totalSurveyActivities }],
        [{ totalQuestionnaireActivities }],
      ] = await Promise.all([
        await tx.select({ task: count() }).from(Tassk),
        await tx.select({ survey: count() }).from(Survey),
        await tx.select({ questionnaire: count() }).from(Questionnaire),
        await tx.select({ taskResponse: count() }).from(TasskQuestionAnswer),
        await tx.select({ surveyResponse: count() }).from(SurveyQuestionAnswer),
        await tx.select({ questionnaireResponse: count() }).from(Answer),
        await tx.select({ totalTaskActivities: count() }).from(TasskActivity),
        await tx.select({ totalSurveyActivities: count() }).from(SurveyActivity),
        await tx.select({ totalQuestionnaireActivities: count() }).from(QuestionnaireActivity),
      ]);

      const [{ inactiveUsers }] = await tx
        .select({ inactiveUsers: count() })
        .from(User)
        .where(and(eq(User.role, 'PATIENT'), eq(User.status, 'ONBOARDING')));

      const [{ activeUsers }] = await tx
        .select({ activeUsers: count() })
        .from(User)
        .where(and(eq(User.role, 'PATIENT'), eq(User.status, 'ACTIVE')));

      const [{ completedTaskActivities }] = await tx
        .select({ completedTaskActivities: count() })
        .from(TasskActivity)
        .where(eq(TasskActivity.status, 'COMPLETED'));

      const [{ completedSurveykActivities }] = await tx
        .select({ completedSurveykActivities: count() })
        .from(SurveyActivity)
        .where(eq(SurveyActivity.status, 'COMPLETED'));

      const [{ completedQuestionnaireActivities }] = await tx
        .select({ completedQuestionnaireActivities: count() })
        .from(QuestionnaireActivity)
        .where(eq(QuestionnaireActivity.status, 'COMPLETED'));

      const totalResponses = taskResponse + surveyResponse + questionnaireResponse;
      const totalActivities = totalQuestionnaireActivities + totalSurveyActivities + totalTaskActivities;
      const completedActivities =
        completedQuestionnaireActivities + completedSurveykActivities + completedTaskActivities;
      const completionRate = (completedActivities / totalActivities) * 100;

      return {
        task,
        survey,
        activeUsers,
        questionnaire,
        inactiveUsers,
        completionRate,
        totalResponses,
        totalActivities,
        rewardPoints: 131_146_529.536,
      };
    });
  }

  async HttpHandleChangePassword(body: Dto.AdminChangePasswordBody, reqUser: TUser) {
    const hasValidPassword = await this.argon.verify(body.oldPassword, reqUser.auth.password);
    if (!hasValidPassword) throw new BadRequestException(RESPONSE.INVALID_CREDENTIALS);

    await this.provider.db
      .update(Auth)
      .set({ password: await this.argon.hash(body.newPassword) })
      .where(eq(Auth.userId, reqUser.id));

    return {};
  }

  async HttpHandleLogin(body: Dto.AdminLoginBody) {
    const admin = await this.provider.db.query.User.findFirst({
      with: { auth: true },
      where: and(eq(User.email, body.email), inArray(User.role, ['ADMIN', 'SUPER_ADMIN'])),
    });

    console.log(admin);

    const isEmailValid = !!admin?.id;
    if (!isEmailValid) throw new BadRequestException(RESPONSE.INVALID_CREDENTIALS);

    const hasValidPassword = await this.argon.verify(body.password, admin.auth.password);
    if (!hasValidPassword) throw new BadRequestException(RESPONSE.INVALID_CREDENTIALS);

    const { accessToken } = await this.GenerateLoginTokens(admin.id);
    return { accessToken };
  }

  private async GenerateLoginTokens(userId: number) {
    const payload = { sub: userId };
    const [accessToken, refreshToken] = [
      this.token.generateAccessToken(payload),
      this.token.generateRefreshToken(payload),
    ];

    await this.provider.db.update(Auth).set({ accessToken, refreshToken }).where(eq(Auth.userId, userId));
    return { accessToken, refreshToken };
  }

  async HttpHandleGetRewardPartners({ q, page, pageSize }: Dto.GetRewardPartners) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const queryFilter = q
      ? or(ilike(RewardPartner.name, searchQuery), ilike(RewardPartner.token, searchQuery))
      : undefined;

    return await this.provider.db.transaction(async (tx) => {
      const data = await tx.query.RewardPartner.findMany({
        limit,
        offset,
        where: queryFilter,
        orderBy: desc(RewardPartner.updatedAt),
      });

      const [{ total }] = await tx
        .select({ total: sql<number>`cast(count(${RewardPartner.id}) as int)` })
        .from(RewardPartner)
        .where(queryFilter);

      return { data, totalBalance: 10_000, pagination: generatePagination(page, pageSize, total) };
    });
  }
}
