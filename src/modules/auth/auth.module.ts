import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TwilioModule } from '../twiio/twilio.module';

@Module({
  imports: [TwilioModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
