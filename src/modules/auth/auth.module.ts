import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TwilioModule } from '../twiio/twilio.module';
import { ArgonService } from '@/core/services/argon.service';
import { TokenService } from '@/core/services/token.service';

@Module({
  imports: [TwilioModule],
  controllers: [AuthController],
  providers: [AuthService, ArgonService, TokenService],
})
export class AuthModule {}
