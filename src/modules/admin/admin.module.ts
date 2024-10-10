import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TokenService } from '@/core/services/token.service';
import { ArgonService } from '@/core/services/argon.service';
import { ContractModule } from '../contract/contract.module';
import { CoinbaseModule } from '../coinbase/coinbase.module';

@Module({
  controllers: [AdminController],
  imports: [ContractModule, CoinbaseModule],
  providers: [AdminService, ArgonService, TokenService],
})
export class AdminModule {}
