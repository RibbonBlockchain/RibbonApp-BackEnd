import { Module } from '@nestjs/common';
import { TokenService } from '@/core/services/token.service';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';

@Module({
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService, TokenService],
})
export class QuestionnaireModule {}
