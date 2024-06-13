import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { QuestionnaireStatusMap, TQuestionnaireStatus } from '@/modules/drizzle/schema';

export class UpdateTaskStatusBody {
  @IsNotEmpty()
  @IsIn(QuestionnaireStatusMap)
  status: TQuestionnaireStatus;

  @IsInt()
  @IsNotEmpty()
  id: number;
}

export class GetTasskCategoriesQuery {
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

export class GetAllTasskQuery {
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
