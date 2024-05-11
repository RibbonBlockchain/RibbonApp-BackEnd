import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { QuestionnaireStatusMap, TQuestionnaireStatus } from '@/modules/drizzle/schema';

export class GetAllQuestionnaireQuery {
  @IsString()
  @IsOptional()
  q: string;

  @IsInt()
  @IsOptional()
  page: number;

  @IsInt()
  @IsOptional()
  pageSize: number;

  @IsOptional()
  @IsIn(QuestionnaireStatusMap)
  status: TQuestionnaireStatus;
}

export class GetAllQuestionnaireCategoryQuery {
  @IsString()
  @IsOptional()
  q: string;

  @IsInt()
  @IsOptional()
  page: number;

  @IsInt()
  @IsOptional()
  pageSize: number;
}
