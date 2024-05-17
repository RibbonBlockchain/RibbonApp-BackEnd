import config from '@/config';
import { diskStorage } from 'multer';
import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { TaskModule } from '../task/task.module';
import { TasskModule } from '../tassk/tassk.module';
import { AdminModule } from '../admin/admin.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { SurveyModule } from '../survey/survey.module';
import { MulterModule } from '@nestjs/platform-express';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { NotificationModule } from '../notification/notification.module';
import { QuestionnaireModule } from '../questionnaire/questionnaire.module';

@Module({
  providers: [AppService],
  controllers: [AppController],
  imports: [
    AuthModule,
    UserModule,
    TaskModule,
    TasskModule,
    AdminModule,
    SurveyModule,
    DrizzleModule,
    NotificationModule,
    QuestionnaireModule,
    ConfigModule.forRoot({ load: [config], isGlobal: true }),
    MulterModule.register({ dest: '/uploads', storage: diskStorage({ destination: 'uploads' }) }),
    MailerModule.forRoot({
      transport: {
        port: 465,
        secure: true,
        host: 'smtp.gmail.com',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      },
    }),
  ],
})
export class AppModule {}
