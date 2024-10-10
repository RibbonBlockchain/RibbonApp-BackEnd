import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TwilioModule } from '../twiio/twilio.module';
import { TokenService } from '@/core/services/token.service';
import { ContractModule } from '../contract/contract.module';
import { CoinbaseModule } from '../coinbase/coinbase.module';

@Module({
  controllers: [UserController],
  providers: [UserService, TokenService],
  imports: [TwilioModule, ContractModule, CoinbaseModule],
})
@Module({})
export class UserModule {}
