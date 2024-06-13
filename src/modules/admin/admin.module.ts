import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TokenService } from '@/core/services/token.service';
import { ArgonService } from '@/core/services/argon.service';
import { ContractModule } from '../contract/contract.module';

@Module({
  imports: [ContractModule],
  controllers: [AdminController],
  providers: [AdminService, ArgonService, TokenService],
})
export class AdminModule {}
