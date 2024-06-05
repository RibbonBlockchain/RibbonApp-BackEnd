import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TwilioModule } from '../twiio/twilio.module';
import { TokenService } from '@/core/services/token.service';
import { ContractModule } from '../contract/contract.module';

@Module({
  controllers: [UserController],
  providers: [UserService, TokenService],
  imports: [TwilioModule, ContractModule],
})
@Module({})
export class UserModule {}
