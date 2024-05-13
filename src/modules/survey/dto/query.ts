import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { QuestionnaireStatusMap, TQuestionnaireStatus } from '@/modules/drizzle/schema';

export class GetAllSurveyQuery {
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

export class GetSurveyCategoriesQuery {
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
