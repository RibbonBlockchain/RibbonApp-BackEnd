import { IsInt,IsNotEmpty, IsString } from 'class-validator';

export class AddQuestionnaire {
  @IsString()
  type: any;

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  question: string;
}
