import { IsInt, IsOptional, IsString } from 'class-validator';

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
