import { IsInt, IsOptional, IsString } from 'class-validator';

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
