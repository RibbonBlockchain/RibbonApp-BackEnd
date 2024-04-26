import { IsInt, IsOptional } from 'class-validator';

export class GetAllQuestionnaireQuery {
  @IsInt()
  @IsOptional()
  page: number;

  @IsInt()
  @IsOptional()
  pageSize: number;
}
