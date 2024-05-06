import { Module } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';
import { TokenService } from '@/core/services/token.service';

@Module({
  controllers: [SurveyController],
  providers: [SurveyService, TokenService],
})
export class SurveyModule {}
