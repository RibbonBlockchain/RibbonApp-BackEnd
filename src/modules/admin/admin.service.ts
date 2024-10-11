import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { ArgonService } from '@/core/services/argon.service';
import { TokenService } from '@/core/services/token.service';
import { endOfDay, httpPost, oneYearAgo } from '@/core/utils';
import { generatePagination, getPage } from '@/core/utils/page';
import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { and, count, countDistinct, desc, eq, gte, ilike, inArray, lte, ne, or, sql } from 'drizzle-orm';
import { promises } from 'fs';
import parsePhoneNumberFromString from 'libphonenumber-js';
import * as XLSX from 'xlsx';
import { CoinbaseService } from '../coinbase/coinbase.service';
import { ContractService } from '../contract/contract.service';
import { TDbProvider } from '../drizzle/drizzle.module';
import {
  Answer,
  Auth,
  BlockTransaction,
  CpiCountry,
  Notification,
  Question,
  QuestionOptions,
  Questionnaire,
  QuestionnaireActivity,
  QuestionnaireCategory,
  QuestionnaireRating,
  RewardPartner,
  Survey,
  SurveyActivity,
  SurveyCategory,
  SurveyQuestion,
  SurveyQuestionAnswer,
  SurveyQuestionOptions,
  SurveyRating,
  TUser,
  Tassk,
  TasskActivity,
  TasskCategory,
  TasskQuestion,
  TasskQuestionAnswer,
  TasskRating,
  User,
  Wallet,
} from '../drizzle/schema';
import * as Dto from './dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly argon: ArgonService,
    private readonly token: TokenService,
    private readonly mailer: MailerService,
    private readonly contract: ContractService,
    private readonly coinbase: CoinbaseService,
    @Inject(DATABASE) private readonly provider: TDbProvider,
  ) {}

  async HttpHandleLogout(user: TUser | undefined) {
    if (!user) return {};

    await this.provider.db.update(Auth).set({ accessToken: null, refreshToken: null }).where(eq(Auth.userId, user.id));
    return {};
  }

  async HttpHandleGetNotifications({ q, page, pageSize }: Dto.GetAllNotificationsQuery, user: TUser) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const queryFilter = q
      ? or(ilike(Notification.message, searchQuery), ilike(Notification.title, searchQuery))
      : undefined;

    const adminFilter = eq(Notification.senderId, user.id);

    const data = await this.provider.db.query.NotificationHistory.findMany({
      limit,
      offset,
      with: { sender: true },
      where: and(queryFilter, adminFilter),
      orderBy: desc(Notification.updatedAt),
    });

    const res = data.map((d) => ({ ...d, user: d.sender }));

    return res;
  }

  async HttpHandleDownloadReport(admin: TUser) {
    const questionnaires = await this.provider.db
      .selectDistinctOn([Question.text], {
        userId: User.id,
        ses: Wallet.point,
        answer: Answer.text,
        location: User.location,
        balance: Wallet.balance,
        response: QuestionOptions.text,
        category: QuestionnaireCategory.name,
        question: Question.text,
        reward: Questionnaire.reward,
        rating: QuestionnaireRating.rating,
      })
      .from(QuestionnaireActivity)
      .leftJoin(User, eq(QuestionnaireActivity.userId, User.id))
      .leftJoin(Wallet, eq(Wallet.userId, User.id))
      .leftJoin(QuestionnaireRating, eq(User.id, QuestionnaireRating.userId))
      .leftJoin(Questionnaire, eq(Questionnaire.id, QuestionnaireActivity.taskId))
      .leftJoin(Question, eq(Question.taskId, Questionnaire.id))
      .leftJoin(QuestionnaireCategory, eq(Questionnaire.categoryId, QuestionnaireCategory.id))
      .leftJoin(Answer, eq(Answer.questionId, Question.id))
      .leftJoin(QuestionOptions, eq(Answer.optionId, QuestionOptions.id))
      .where(and(eq(QuestionnaireActivity.status, 'COMPLETED'), ne(QuestionnaireActivity.type, 'DAILY_REWARD')))
      .groupBy(
        User.id,
        Answer.id,
        Question.id,
        Wallet.point,
        Wallet.balance,
        Questionnaire.id,
        QuestionOptions.id,
        QuestionnaireRating.id,
        QuestionnaireCategory.id,
        QuestionnaireActivity.id,
      );

    const questionGroups = {};

    questionnaires.forEach((entry) => {
      const { question, response, category } = entry;
      if (!questionGroups[question]) {
        questionGroups[question] = { category: category, answers: {} };
      }
      if (!questionGroups[question].answers[response]) {
        questionGroups[question].answers[response] = 0;
      }
      questionGroups[question].answers[response] += 1;
    });

    // Step 2: Construct the output structure
    const output = Object.keys(questionGroups).map((question) => {
      return {
        category: questionGroups[question].category,
        question: question,
        answers: questionGroups[question].answers,
      };
    });

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

    const qsheet = XLSX.utils.json_to_sheet(output);
    const worksheet = XLSX.utils.json_to_sheet(users);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dates');
    XLSX.utils.book_append_sheet(workbook, qsheet, 'Questionnaire');

    XLSX.writeFile(workbook, 'Reports.xlsx', { compression: true });
    const file = await promises.readFile('Reports.xlsx');

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

  async HttpHandleGetRewardPartnerById(id: number) {
    const partner: any = await this.provider.db.query.RewardPartner.findFirst({
      where: eq(RewardPartner.id, id),
    });

    partner.balance = partner?.vaultAddress ? await this.contract.getVaultBalance(partner.vaultAddress) : 0;
    await this.provider.db.update(RewardPartner).set({ volume: partner.balance }).where(eq(RewardPartner.id, id));

    if (!!partner.privateKey && !!partner.address && partner.provider === 'COINBASE') {
      const [balance, err] = await this.coinbase.getBalance(partner.privateKey);

      partner.walletBalance = 0;
      if (balance) partner.walletBalance = balance;
      if (err) console.error(err);
    }

    return partner;
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

  async HttpHandleCreateVault(body: Dto.AdminCreateVaultBody, user: TUser | undefined) {
    if (user.role === 'SUPER_ADMIN' && !body.partnerId) throw new BadRequestException('Partner ID required');
    if (user.role === 'ADMIN' && !user?.partnerId) throw new BadRequestException('Account not linked to any partner');

    const partnerId = user.role === 'ADMIN' ? user.partnerId : body.partnerId;
    const partner = await this.provider.db.query.RewardPartner.findFirst({
      where: eq(RewardPartner.id, partnerId),
    });

    if (!partner?.name) throw new BadRequestException('Partner linked to your account is not active');
    if (partner.vaultAddress) throw new BadRequestException('A vault address already exist for this partner');

    // TODO: connect partners to admin account
    const res = await this.contract.createVault({ name: partner.name, address: body.address, points: body.points });

    if (res.vaultAddress) {
      await this.provider.db
        .update(RewardPartner)
        .set({ vaultAddress: res.vaultAddress })
        .where(eq(RewardPartner.id, partner.id));
    }

    return { vaultAddres: res.vaultAddress };
  }

  async HttpHandleWalletTransfer(body: Dto.AdminWalletTransferBody, user: TUser | undefined) {
    // TODO: connect partners to admin account

    const worldCoinPartner = await this.provider.db.query.RewardPartner.findFirst({
      where: eq(RewardPartner.name, 'Worldcoin'),
    });

    if (!worldCoinPartner?.vaultAddress) throw new BadRequestException('Reward Partner not active');

    const res = await this.contract.transfer(worldCoinPartner.vaultAddress, body.amount);

    await this.provider.db.insert(BlockTransaction).values({
      userId: user.id,
      amount: +body.amount,
      metadata: JSON.stringify(res),
      partnerId: worldCoinPartner.id,
      points: +body.amount,
    });

    return {};
  }

  async HttpHandleWalletHistory({ page, pageSize }: Dto.GetBlockTransactions) {
    const { limit, offset } = getPage({ page, pageSize });

    const worldCoinPartner = await this.provider.db.query.RewardPartner.findFirst({
      where: eq(RewardPartner.name, 'Worldcoin'),
    });

    const data = await this.provider.db.query.BlockTransaction.findMany({
      limit,
      offset,
      with: { admin: true },
      orderBy: desc(BlockTransaction.updatedAt),
      where: eq(BlockTransaction.partnerId, worldCoinPartner.id),
    });

    const [{ total }] = await this.provider.db
      .select({ total: sql<number>`cast(count(${BlockTransaction.id}) as int)` })
      .from(BlockTransaction)
      .where(eq(BlockTransaction.partnerId, worldCoinPartner.id));

    return { data, pagination: generatePagination(page, pageSize, total) };
  }

  async HttpHandleRatingOverview(type: 's' | 't' | 'q') {
    // let data;
    // let typeData;
    // let activitiesRated;
    const users = await this.provider.db.select().from(User);

    if (type === 's') {
      const data = await this.provider.db
        .select()
        .from(SurveyRating)
        .innerJoin(Survey, eq(SurveyRating.surveyId, Survey.id));

      const typeData = await this.provider.db
        .select()
        .from(Survey)
        .innerJoin(SurveyCategory, eq(Survey.categoryId, SurveyCategory.id));

      const activitiesRated = typeData.map((s) => ({
        activity: s.survey_category.name,
        surveyId: s.survey.id,
        total: 0,
        sum: 0,
        average: 0,
        status: '',
      }));

      const sIds: any[] = typeData.map((s) => s.survey.id);
      const ratings = data.map((r) => r.survey_rating);

      ratings.forEach((r) => {
        const activity = activitiesRated.find((a) => a.surveyId === r.surveyId);
        if (activity) {
          activity.total++;
          activity.sum += r.rating;
          activity.average = +(activity.sum / activity.total).toFixed(2);
        }
      });

      let totalSum = activitiesRated.reduce((sum, activity) => sum + activity.sum, 0);

      activitiesRated.forEach((a) => {
        delete a.surveyId;
        a.status = `${((a.sum / totalSum) * 100).toFixed(2)}%`;
      });

      const sidsWithRatings = [...new Set(data.map((r) => r.survey).map((q) => q.id))];
      const sidsWithoutRatings = sIds.filter((id) => !sidsWithRatings.includes(id));

      const ratedActivities = ((sidsWithRatings.length / sIds.length) * 100).toFixed(0);
      const unratedActivities = ((sidsWithoutRatings.length / sIds.length) * 100).toFixed(0);

      let ratingDistributions = [
        {
          type: 0,
          total: 0,
          percentage: 0,
        },
        {
          type: 1,
          total: 0,
          percentage: 0,
        },
        {
          type: 2,
          total: 0,
          percentage: 0,
        },
        {
          type: 3,
          total: 0,
          percentage: 0,
        },
        {
          type: 4,
          total: 0,
          percentage: 0,
        },
        {
          type: 5,
          total: 0,
          percentage: 0,
        },
      ];

      ratings.forEach((item) => {
        const distribution = ratingDistributions.find((rd) => rd.type === item.rating);
        if (distribution) distribution.total += 1;
      });

      const totalRatings = ratingDistributions.reduce((sum, rating) => sum + rating.total, 0);

      ratingDistributions = ratingDistributions.map((rating) => ({
        ...rating,
        percentage: totalRatings ? +((rating.total / totalRatings) * 100).toFixed(1) : 0,
      }));

      const ratingsStatus = {
        ratedActivities,
        unratedActivities,
        total: ratings.length,
      };

      const totalAverageRatings = (ratings.reduce((sum, task) => sum + task.rating, 0) / ratings.length).toFixed(1);

      const userRatingsIds = ratings.map((r) => r.userId);
      const mapUserCode = users
        .filter((u) => u.phone)
        .map((u) => ({ code: `+${parsePhoneNumberFromString(u.phone)?.countryCallingCode}`, id: u.id }));

      const idMap = mapUserCode.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      const codeCount = userRatingsIds.reduce((acc, id) => {
        const code = idMap[id]?.code;
        if (code) {
          acc[code] = (acc[code] || 0) + 1;
        }
        return acc;
      }, {});

      const totalCount = userRatingsIds.length;

      const geoDistribution = Object.keys(codeCount).map((code) => ({
        code: code,
        count: codeCount[code],
        percentage: ((codeCount[code] / totalCount) * 100).toFixed(0) + '%',
      }));

      return { ratingsStatus, totalAverageRatings, ratingDistributions, activitiesRated, geoDistribution };
    } else if (type === 'q') {
      const data = await this.provider.db
        .select()
        .from(QuestionnaireRating)
        .innerJoin(Questionnaire, eq(QuestionnaireRating.questionId, Questionnaire.id));

      const typeData = await this.provider.db
        .select()
        .from(Questionnaire)
        .innerJoin(QuestionnaireCategory, eq(Questionnaire.categoryId, QuestionnaireCategory.id));

      const activitiesRated = typeData.map((q) => ({
        activity: q.questionnaire_category.name,
        questionnaireId: q.questionnaire.id,
        total: 0,
        sum: 0,
        average: 0,
        status: '',
      }));

      const qIds: any[] = typeData.map((q) => q.questionnaire.id);
      const ratings = data.map((r) => r.questionnaire_rating);

      ratings.forEach((r) => {
        const activity = activitiesRated.find((a) => a.questionnaireId === r.questionId);
        if (activity) {
          activity.total++;
          activity.sum += r.rating;
          activity.average = +(activity.sum / activity.total).toFixed(2);
        }
      });

      let totalSum = activitiesRated.reduce((sum, activity) => sum + activity.sum, 0);

      activitiesRated.forEach((a) => {
        delete a.questionnaireId;
        a.status = `${((a.sum / totalSum) * 100).toFixed(2)}%`;
      });

      const qidsWithRatings = [...new Set(data.map((r) => r.questionnaire).map((q) => q.id))];
      const qidsWithoutRatings = qIds.filter((id) => !qidsWithRatings.includes(id));

      const ratedActivities = ((qidsWithRatings.length / qIds.length) * 100).toFixed(0);
      const unratedActivities = ((qidsWithoutRatings.length / qIds.length) * 100).toFixed(0);

      let ratingDistributions = [
        {
          type: 0,
          total: 0,
          percentage: 0,
        },
        {
          type: 1,
          total: 0,
          percentage: 0,
        },
        {
          type: 2,
          total: 0,
          percentage: 0,
        },
        {
          type: 3,
          total: 0,
          percentage: 0,
        },
        {
          type: 4,
          total: 0,
          percentage: 0,
        },
        {
          type: 5,
          total: 0,
          percentage: 0,
        },
      ];

      ratings.forEach((item) => {
        const distribution = ratingDistributions.find((rd) => rd.type === item.rating);
        if (distribution) distribution.total += 1;
      });

      const totalRatings = ratingDistributions.reduce((sum, rating) => sum + rating.total, 0);

      ratingDistributions = ratingDistributions.map((rating) => ({
        ...rating,
        percentage: totalRatings ? +((rating.total / totalRatings) * 100).toFixed(1) : 0,
      }));

      const ratingsStatus = {
        ratedActivities,
        unratedActivities,
        total: ratings.length,
      };

      const totalAverageRatings = (ratings.reduce((sum, task) => sum + task.rating, 0) / ratings.length).toFixed(1);

      const userRatingsIds = ratings.map((r) => r.userId);
      const mapUserCode = users
        .filter((u) => u.phone)
        .map((u) => ({ code: `+${parsePhoneNumberFromString(u.phone)?.countryCallingCode}`, id: u.id }));

      const idMap = mapUserCode.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      const codeCount = userRatingsIds.reduce((acc, id) => {
        const code = idMap[id]?.code;
        if (code) {
          acc[code] = (acc[code] || 0) + 1;
        }
        return acc;
      }, {});

      const totalCount = userRatingsIds.length;

      const geoDistribution = Object.keys(codeCount).map((code) => ({
        code: code,
        count: codeCount[code],
        percentage: ((codeCount[code] / totalCount) * 100).toFixed(0) + '%',
      }));

      return { ratingsStatus, totalAverageRatings, ratingDistributions, activitiesRated, geoDistribution };
    } else if (type === 't') {
      const data = await this.provider.db.select().from(TasskRating).innerJoin(Tassk, eq(TasskRating.taskId, Tassk.id));

      const typeData = await this.provider.db
        .select()
        .from(Tassk)
        .innerJoin(TasskCategory, eq(Tassk.categoryId, TasskCategory.id));

      const activitiesRated = typeData.map((t) => ({
        activity: t.task_category.name,
        taskId: t.tassk.id,
        total: 0,
        sum: 0,
        average: 0,
        status: '',
      }));

      const tIds: any[] = typeData.map((t) => t.tassk.id);
      const ratings = data.map((r) => r.task_rating);

      ratings.forEach((r) => {
        const activity = activitiesRated.find((a) => a.taskId === r.taskId);
        if (activity) {
          activity.total++;
          activity.sum += r.rating;
          activity.average = +(activity.sum / activity.total).toFixed(2);
        }
      });

      let totalSum = activitiesRated.reduce((sum, activity) => sum + activity.sum, 0);

      activitiesRated.forEach((a) => {
        delete a.taskId;
        a.status = `${((a.sum / totalSum) * 100).toFixed(2)}%`;
      });

      const sidsWithRatings = [...new Set(data.map((r) => r.tassk).map((q) => q.id))];
      const sidsWithoutRatings = tIds.filter((id) => !sidsWithRatings.includes(id));

      const ratedActivities = ((sidsWithRatings.length / tIds.length) * 100).toFixed(0);
      const unratedActivities = ((sidsWithoutRatings.length / tIds.length) * 100).toFixed(0);

      let ratingDistributions = [
        {
          type: 0,
          total: 0,
          percentage: 0,
        },
        {
          type: 1,
          total: 0,
          percentage: 0,
        },
        {
          type: 2,
          total: 0,
          percentage: 0,
        },
        {
          type: 3,
          total: 0,
          percentage: 0,
        },
        {
          type: 4,
          total: 0,
          percentage: 0,
        },
        {
          type: 5,
          total: 0,
          percentage: 0,
        },
      ];

      ratings.forEach((item) => {
        const distribution = ratingDistributions.find((rd) => rd.type === item.rating);
        if (distribution) distribution.total += 1;
      });

      const totalRatings = ratingDistributions.reduce((sum, rating) => sum + rating.total, 0);

      ratingDistributions = ratingDistributions.map((rating) => ({
        ...rating,
        percentage: totalRatings ? +((rating.total / totalRatings) * 100).toFixed(1) : 0,
      }));

      const ratingsStatus = {
        ratedActivities,
        unratedActivities,
        total: ratings.length,
      };

      const totalAverageRatings = (ratings.reduce((sum, task) => sum + task.rating, 0) / ratings.length).toFixed(1);

      const userRatingsIds = ratings.map((r) => r.userId);
      const mapUserCode = users
        .filter((u) => u.phone)
        .map((u) => ({ code: `+${parsePhoneNumberFromString(u.phone)?.countryCallingCode}`, id: u.id }));

      const idMap = mapUserCode.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      const codeCount = userRatingsIds.reduce((acc, id) => {
        const code = idMap[id]?.code;
        if (code) {
          acc[code] = (acc[code] || 0) + 1;
        }
        return acc;
      }, {});

      const totalCount = userRatingsIds.length;

      const geoDistribution = Object.keys(codeCount).map((code) => ({
        code: code,
        count: codeCount[code],
        percentage: ((codeCount[code] / totalCount) * 100).toFixed(0) + '%',
      }));

      return { ratingsStatus, totalAverageRatings, ratingDistributions, activitiesRated, geoDistribution };
    } else {
      return {};
    }
  }

  // async HttpHandleUploadCpi(file: Express.Multer.File, user: TUser) {
  //   const sheets = excelToJson({
  //     sourceFile: file.path,
  //     columnToKey: { '*': '{{columnHeader}}' },
  //   });

  //   const months = [
  //     'january',
  //     'february',
  //     'march',
  //     'april',
  //     'may',
  //     'june',
  //     'july',
  //     'august',
  //     'september',
  //     'october',
  //     'november',
  //     'december',
  //   ];

  //   const currentYear = new Date().getFullYear();

  //   const cpiData = sheets[Object.keys(sheets)[0]].slice(1).map((entry) => {
  //     const newEntry = { year: currentYear.toString() };
  //     for (let key in entry) {
  //       if (entry.hasOwnProperty(key)) {
  //         newEntry[key.toLowerCase()] = entry[key];
  //       }
  //     }

  //     months.forEach((month) => {
  //       if (!(month in newEntry)) {
  //         newEntry[month] = null;
  //       }
  //     });
  //     return newEntry;
  //   });

  //   await this.provider.db.insert(Cpi).values(cpiData);
  //   await this.provider.db.insert(CpiHistory).values({ userId: user.auth.userId, fileName: file.originalname });

  //   fs.rm(file.path, () => {});
  // }

  async HttpHandleGetCpiData(year: number, country: string) {
    const countryCpi = await this.provider.db.query.CpiCountry.findFirst({
      with: {
        indexes: true,
      },
      where: eq(CpiCountry.name, country),
    });

    return countryCpi.indexes.filter((cp) => cp.year === year);
  }

  async HttpHandleGetCpiCountryData() {
    const cpi = await this.provider.db.query.CpiCountry.findMany({
      with: {
        indexes: true,
      },
    });

    const data = cpi.map((country) => {
      const uniqueYears = [...new Set(country.indexes.map((index) => index.year))];
      return {
        id: country.id,
        name: country.name,
        years: uniqueYears,
      };
    });

    return data;
  }

  async HttpHandleGetCpiHistory() {
    const data = await this.provider.db.query.CpiHistory.findMany({
      with: {
        user: true,
      },
    });
    return data;
  }

  async HttpHandleGetUsersActivitiesReports({ q, page = 1, pageSize = 50 }: Dto.GetUsersActivitiesReportsQuery) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const queryFilter = q
      ? or(
          ilike(User.email, searchQuery),
          ilike(User.firstName, searchQuery),
          ilike(User.lastName, searchQuery),
          ilike(User.phone, searchQuery),
        )
      : undefined;

    const [{ total }] = await this.provider.db
      .select({ total: sql<number>`cast(count(${User.id}) as int)` })
      .from(User)
      .where(and(eq(User.role, 'PATIENT'), queryFilter));

    const data = await this.provider.db
      .selectDistinctOn([User.id], {
        id: User.id,
        ses: Wallet.point,
        location: User.location,
        createdAt: User.createdAt,
        updatedAt: User.updatedAt,
        totalRewards: Wallet.balance,
        dailyRewards: Wallet.dailyReward,
        totalRatings: countDistinct(QuestionnaireRating.id),
        questionnaires: countDistinct(QuestionnaireActivity.id),
      })
      .from(User)
      .leftJoin(Wallet, eq(User.id, Wallet.userId))
      .leftJoin(QuestionnaireRating, eq(User.id, QuestionnaireRating.userId))
      .leftJoin(
        QuestionnaireActivity,
        and((eq(User.id, QuestionnaireActivity.userId), eq(QuestionnaireActivity.status, 'COMPLETED'))),
      )
      .limit(limit)
      .offset(offset)
      .where(and(eq(User.role, 'PATIENT'), queryFilter))
      .groupBy(User.id, Wallet.point, Wallet.balance, Wallet.dailyReward, QuestionnaireActivity.userId)
      .orderBy(User.id);

    return { data, pagination: generatePagination(page, pageSize, total) };
  }

  async HttpHandleGetUserQuestionnaireReport(id: number) {
    const questionnaires = await this.provider.db
      .selectDistinctOn([Question.text], {
        userId: User.id,
        ses: Wallet.point,
        answer: Answer.text,
        location: User.location,
        balance: Wallet.balance,
        response: QuestionOptions.text,
        category: QuestionnaireCategory.name,
        question: Question.text,
        reward: Questionnaire.reward,
        rating: QuestionnaireRating.rating,
      })
      .from(QuestionnaireActivity)
      .leftJoin(User, eq(QuestionnaireActivity.userId, User.id))
      .leftJoin(Wallet, eq(Wallet.userId, User.id))
      .leftJoin(QuestionnaireRating, eq(User.id, QuestionnaireRating.userId))
      .leftJoin(Questionnaire, eq(Questionnaire.id, QuestionnaireActivity.taskId))
      .leftJoin(Question, eq(Question.taskId, Questionnaire.id))
      .leftJoin(QuestionnaireCategory, eq(Questionnaire.categoryId, QuestionnaireCategory.id))
      .leftJoin(Answer, eq(Answer.questionId, Question.id))
      .leftJoin(QuestionOptions, eq(Answer.optionId, QuestionOptions.id))
      .where(
        and(
          eq(QuestionnaireActivity.userId, id),
          eq(QuestionnaireActivity.status, 'COMPLETED'),
          ne(QuestionnaireActivity.type, 'DAILY_REWARD'),
        ),
      )
      .groupBy(
        User.id,
        Answer.id,
        Question.id,
        Wallet.point,
        Wallet.balance,
        Questionnaire.id,
        QuestionOptions.id,
        QuestionnaireRating.id,
        QuestionnaireCategory.id,
        QuestionnaireActivity.id,
      );

    const question = questionnaires?.[0];
    const user = {
      id: question?.userId,
      location: question?.location,
      ses: question?.ses,
      rating: question?.rating,
      totalReward: question?.balance,
    };

    const result = {};

    questionnaires.forEach((item) => {
      const { category, question, reward, rating, response, answer } = item;

      if (!result[category]) {
        result[category] = [];
      }

      result[category].push({ question, reward, rating, response, answer });
    });

    return { user, data: result };
  }

  async HttpHandleGetUserSurveyReport(id: number) {
    const surveys = await this.provider.db
      .selectDistinctOn([SurveyQuestion.text], {
        userId: User.id,
        ses: Wallet.point,
        reward: Survey.reward,
        location: User.location,
        balance: Wallet.balance,
        rating: SurveyRating.rating,
        category: SurveyCategory.name,
        question: SurveyQuestion.text,
        response: SurveyQuestionOptions.text,
      })
      .from(SurveyActivity)
      .leftJoin(User, eq(SurveyActivity.userId, User.id))
      .leftJoin(Wallet, eq(Wallet.userId, User.id))
      .leftJoin(Survey, eq(Survey.id, SurveyActivity.surveyId))
      .leftJoin(SurveyRating, eq(User.id, SurveyRating.userId))
      .leftJoin(SurveyCategory, eq(Survey.categoryId, SurveyCategory.id))
      .leftJoin(SurveyQuestion, eq(SurveyQuestion.surveyId, Survey.id))
      .leftJoin(SurveyQuestionAnswer, eq(SurveyQuestionAnswer.questionId, SurveyQuestion.id))
      .leftJoin(SurveyQuestionOptions, eq(SurveyQuestionAnswer.optionId, SurveyQuestionOptions.id))
      .where(and(eq(SurveyActivity.userId, id), eq(SurveyActivity.status, 'COMPLETED')))
      .groupBy(
        User.id,
        Survey.id,
        Wallet.point,
        Wallet.balance,
        SurveyRating.id,
        SurveyCategory.id,
        SurveyActivity.id,
        SurveyQuestion.id,
        SurveyQuestionAnswer.id,
        SurveyQuestionOptions.id,
      );

    const survey = surveys?.[0];
    const user = {
      id: survey?.userId,
      location: survey?.location,
      ses: survey?.ses,
      rating: survey?.rating,
      totalReward: survey?.balance,
    };

    const result = {};

    surveys.forEach((item) => {
      const { category, question, reward, rating, response } = item;

      if (!result[category]) {
        result[category] = [];
      }

      result[category].push({ question, reward, rating, response });
    });

    return { user, data: result };
  }

  async HttpHandleGetUserTaskReport(id: number) {
    const questionnaires = await this.provider.db
      .selectDistinctOn([TasskQuestion.text], {
        userId: User.id,
        ses: Wallet.point,
        reward: Tassk.reward,
        location: User.location,
        balance: Wallet.balance,
        rating: TasskRating.rating,
        category: TasskCategory.name,
        question: TasskQuestion.text,
        response: TasskQuestionAnswer.response,
      })
      .from(TasskActivity)
      .leftJoin(User, eq(TasskActivity.userId, User.id))
      .leftJoin(Wallet, eq(Wallet.userId, User.id))
      .leftJoin(Tassk, eq(Tassk.id, TasskActivity.taskId))
      .leftJoin(TasskRating, eq(User.id, TasskRating.userId))
      .leftJoin(TasskQuestion, eq(TasskQuestion.taskId, Tassk.id))
      .leftJoin(TasskCategory, eq(Tassk.categoryId, TasskCategory.id))
      .leftJoin(TasskQuestionAnswer, eq(TasskQuestionAnswer.questionId, TasskQuestion.id))
      .where(and(eq(TasskActivity.userId, id), eq(TasskActivity.status, 'COMPLETED')))
      .groupBy(
        User.id,
        Tassk.id,
        Wallet.point,
        TasskRating.id,
        Wallet.balance,
        TasskCategory.id,
        TasskActivity.id,
        TasskQuestion.id,
        TasskQuestionAnswer.id,
      );

    const question = questionnaires?.[0];
    const user = {
      id: question?.userId,
      location: question?.location,
      ses: question?.ses,
      rating: question?.rating,
      totalReward: question?.balance,
    };

    const result = {};

    questionnaires.forEach((item) => {
      const { category, question, reward, rating, response } = item;

      if (!result[category]) {
        result[category] = [];
      }

      result[category].push({ question, reward, rating, response });
    });

    return { user, data: result };
  }

  async HttpHandleWalletClaimedPoints(query: Dto.GetTotalClaimedPoints) {
    const [res, err] = await httpPost<any, any>({
      // TODO make this dynamic
      url: 'https://api.studio.thegraph.com/query/79390/worldcoin-vault/v1',
      body: {
        query: `
        {
          pointsClaimeds (where: { and: [{timestamp_gte: "${parseInt(String(query.from / 1000))}" }, { timestamp_lte: "${parseInt(String(query.to / 1000))}" }] })
          { id user timestamp amount blockNumber blockTimestamp transactionHash }
        }
    `,
      },
    });

    if (err) throw new UnprocessableEntityException(err);

    let sum = 0;
    res?.data?.pointsClaimeds.forEach((obj) => {
      let amount = parseFloat(obj.amount);
      sum += amount;
    });

    await this.provider.db.update(RewardPartner).set({ claimedPoints: sum }).where(eq(RewardPartner.token, 'WLD'));

    const rewardPartners = await this.provider.db.query.RewardPartner.findMany({});

    const points: any = {};

    rewardPartners.forEach((partner: any) => {
      if (partner.token === 'WLD') {
        points[partner.token] = sum;
      } else {
        points[partner.token] = 0;
      }
    });

    return { data: points };
  }

  async HttpHandleWalletBalance(query: Dto.GetWalletBalance, reqUser: TUser) {
    const partner = await this.provider.db.query.RewardPartner.findFirst({
      where: eq(RewardPartner.id, query?.partnerId || reqUser.partnerId),
    });

    if (!partner?.vaultAddress) throw new BadRequestException('Vault not available for reward partner');
    const balance = await this.contract.getVaultBalance(partner.vaultAddress);
    return { balance };
  }

  async HttpHandleCreateRewardPartnerWallet(id: number) {
    const partner = await this.provider.db.query.RewardPartner.findFirst({ where: eq(RewardPartner.id, id) });
    if (!partner) throw new BadRequestException();

    if (partner.address) return { address: partner.address };

    const [coinbaseWallet] = await this.coinbase.createWallet();
    const address = await coinbaseWallet?.address;

    if (!coinbaseWallet || !address) throw new BadRequestException('Unable to create wallet');

    await this.provider.db.update(RewardPartner).set({
      provider: 'COINBASE',
      updatedAt: new Date(),
      address: address.getId(),
      privateKey: btoa(JSON.stringify(coinbaseWallet.privateKey)),
    });

    return { address: address.getId() };
  }

  async HttpHandleGetRewardPartnerWallet(id: number, user: TUser) {
    const partner = await this.provider.db.query.RewardPartner.findFirst({ where: eq(RewardPartner.id, id) });
    if (!partner) throw new BadRequestException();
    if (user.partnerId !== partner.id) throw new BadRequestException();
    if (!partner?.privateKey) throw new BadRequestException(RESPONSE.NO_WALLET_ADDRESS);

    const [res, err] = await this.coinbase.transactions(partner.privateKey);
    if (err) throw new BadRequestException(err);

    return res;
  }

  async HttpHandlRewardPartnerMassPayout(id: number, reqBody: Dto.MassTransferBody, user: TUser) {
    const data = [...reqBody.data];

    const partner = await this.provider.db.query.RewardPartner.findFirst({ where: eq(RewardPartner.id, id) });

    if (!partner) throw new BadRequestException();
    if (user.partnerId !== partner.id) throw new BadRequestException();
    if (!partner?.privateKey) throw new BadRequestException(RESPONSE.NO_WALLET_ADDRESS);

    for await (let addr of reqBody.data) {
      const [res, err] = await this.coinbase.transfer({
        amount: addr.amount,
        address: addr.address,
        privateKey: partner.privateKey,
      });

      const idx = data.findIndex((x) => x.address === addr.address);
      if (idx < 0) continue;

      data[idx].err = (err as any)?.message as any;
      data[idx].status = !!res?.hash && !err ? 'complete' : 'failed';
    }

    return { data };
  }
}
