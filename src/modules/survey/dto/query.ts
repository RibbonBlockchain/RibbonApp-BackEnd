import { IsInt, IsOptional } from 'class-validator';

export class GetAllSurveyQuery {
  @IsInt()
  @IsOptional()
  page: number;

  @IsInt()
  @IsOptional()
  pageSize: number;
}
