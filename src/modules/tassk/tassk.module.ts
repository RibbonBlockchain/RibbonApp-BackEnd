import { Module } from '@nestjs/common';
import { TasskService } from './tassk.service';
import { TasskController } from './tassk.controller';
import { TokenService } from '@/core/services/token.service';

@Module({
  controllers: [TasskController],
  providers: [TasskService, TokenService],
})
export class TasskModule {}
