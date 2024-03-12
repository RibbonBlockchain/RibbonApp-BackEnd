import config from '@/config';
import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';
import { DrizzleModule } from '../drizzle/drizzle.module';

@Module({
  providers: [AppService],
  controllers: [AppController],
  imports: [AuthModule, AdminModule, DrizzleModule, ConfigModule.forRoot({ load: [config], isGlobal: true })],
})
export class AppModule {}
