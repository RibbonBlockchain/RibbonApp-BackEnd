import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TokenService } from '@/core/services/token.service';
import { TwilioModule } from '../twiio/twilio.module';

@Module({
  imports: [TwilioModule],
  controllers: [UserController],
  providers: [UserService, TokenService],
})
@Module({})
export class UserModule {}
