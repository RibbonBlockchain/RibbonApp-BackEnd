import { IsInt, IsOptional } from 'class-validator';

export class GetAllTasskQuery {
  @IsInt()
  @IsOptional()
  page: number;

  @IsInt()
  @IsOptional()
  pageSize: number;
}
