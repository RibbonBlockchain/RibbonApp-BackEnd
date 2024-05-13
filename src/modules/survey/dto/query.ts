import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { QuestionnaireStatusMap, TQuestionnaireStatus } from '@/modules/drizzle/schema';

export class UpdateSurveyStatusBody {
  @IsNotEmpty()
  @IsIn(QuestionnaireStatusMap)
  status: TQuestionnaireStatus;

  @IsInt()
  @IsNotEmpty()
  id: number;
}

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
